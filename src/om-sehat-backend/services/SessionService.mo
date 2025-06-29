// SessionService module in Motoko
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Float "mo:base/Float";
import Char "mo:base/Char";
import Nat32 "mo:base/Nat32";
import Order "mo:base/Order";
import IC "ic:aaaaa-aa";

import Session "../models/Session";
import Message "../models/Message";
import Doctor "../models/Doctor";
import User "../models/User";
import LLMResponse "../schemas/LLMResponse";
import DoctorService "./DoctorService";

module {
  // Error types for the SessionService
  public type Error = {
    #SessionNotFound : Text;
    #MessageCreationFailed : Text;
    #LLMRequestFailed : Text;
    #JSONParsingFailed : Text;
    #InternalError : Text;
  };
  
  // Convert a Message to LLM content format
  private func convertMessageToContent(message : Message.Message) : ?{role : Text; text : Text} {
    if (message.role == "user" or message.role == "omsapa") {
      ?{
        role = message.role;
        text = message.content;
      }
    } else {
      null
    };
  };
  
  // Get LLM response from Gemini API
  public func getLLMResponse(
    newMessage : Text,
    session : Session.Session,
    user : User.User,
    messages : [Message.Message],
    doctors : HashMap.HashMap<Text, Doctor.Doctor>,
    geminiApiKey : Text
  ) : async Result.Result<Text, Error> {
    // Build the system prompt using the session data
    let systemPrompt = buildSystemPrompt(session, user, doctors);
    Debug.print("System Prompt: " # systemPrompt);
    
    // Build a history array with previous messages
    let historyBuffer = Buffer.Buffer<{role : Text; text : Text}>(0);
    
    for (message in messages.vals()) {
      switch (convertMessageToContent(message)) {
        case (?content) {
          historyBuffer.add(content);
        };
        case (null) {
          // Skip invalid messages
        };
      };
    };
    
    // Convert message history to JSON format for the API request
    let historyArray = Buffer.toArray(historyBuffer);
    
    // Create JSON request for the Gemini API
    let requestJson = createGeminiRequestJson(systemPrompt, historyArray, newMessage);
    
    let requestBody = Text.encodeUtf8(requestJson);
    
    // Prepare request headers
    let requestHeaders = [
      { name = "Content-Type"; value = "application/json" },
      { name = "x-goog-api-key"; value = geminiApiKey },
    ];
    
    let httpRequest : IC.http_request_args = {
      url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
      max_response_bytes = null;
      headers = requestHeaders;
      body = ?requestBody;
      method = #post;
      transform = null;
    };
    
    // Send the request with cycles
    let httpResponse : IC.http_request_result = await (with cycles = 230_949_972_000) IC.http_request(httpRequest);
    
    // Check for non-success status codes
    if (httpResponse.status >= 400) {
      // Get the response body for more details about the error
      let errorBody = switch (Text.decodeUtf8(httpResponse.body)) {
        case (null) { "No response body" };
        case (?text) { text };
      };
      
      return #err(#LLMRequestFailed("Error from Gemini API: " # 
        Int.toText(httpResponse.status) # 
        " - Response: " # errorBody));
    };
    
    // Decode the successful response
    let responseBody : Text = switch (Text.decodeUtf8(httpResponse.body)) {
      case (null) { return #err(#LLMRequestFailed("Empty response from Gemini API")); };
      case (?text) { text };
    };
    
    #ok(responseBody)
  };
  
  // Update chat history with new messages
  public func updateChatHistory(
    sessionId : Text,
    newMessage : Text,
    llmResponse : Text,
    sessions : HashMap.HashMap<Text, Session.Session>,
    messages : HashMap.HashMap<Text, Message.Message>
  ) : Result.Result<(), Error> {
    // Get the session from the HashMap
    switch (sessions.get(sessionId)) {
      case (null) {
        return #err(#SessionNotFound("Session not found with ID: " # sessionId));
      };
      case (?_) {
        // Session exists, continue
      };
    };
    
    // Create timestamp for the messages
    let now = Time.now();
    
    // Create and save user message
    let userMessageId = "msg-" # Int.toText(now);
    let userMessage : Message.Message = {
      id = userMessageId;
      role = "user";
      content = newMessage;
      sessionId = sessionId;
      createdAt = now;
      updatedAt = now;
    };
    
    // Create and save LLM response message (1ms later for ordering)
    let llmMessageId = "msg-" # Int.toText(now + 1_000_000); // Add 1ms in nanoseconds
    let llmMessage : Message.Message = {
      id = llmMessageId;
      role = "omsapa";
      content = llmResponse;
      sessionId = sessionId;
      createdAt = now + 1_000_000; // Add 1ms in nanoseconds
      updatedAt = now + 1_000_000;
    };
    
    // Save the messages
    messages.put(userMessageId, userMessage);
    messages.put(llmMessageId, llmMessage);
    
    #ok(())
  };
  
  // Get session data by ID
  public func getSessionData(
    sessionId : Text,
    sessions : HashMap.HashMap<Text, Session.Session>,
    users : HashMap.HashMap<Text, User.User>,
    messages : HashMap.HashMap<Text, Message.Message>
  ) : Result.Result<(Session.Session, User.User, [Message.Message]), Error> {
    // Get the session from the hashmap
    switch (sessions.get(sessionId)) {
      case (null) {
        return #err(#SessionNotFound("Session not found with ID: " # sessionId));
      };
      case (?session) {
        // Get the user associated with the session
        switch (users.get(session.userId)) {
          case (null) {
            return #err(#InternalError("User not found for session"));
          };
          case (?user) {
            // Get all messages for this session
            let sessionMessages = Buffer.Buffer<Message.Message>(0);
            
            for (message in messages.vals()) {
              if (message.sessionId == sessionId) {
                sessionMessages.add(message);
              };
            };
            
            // Sort messages by createdAt
            let messagesArray = Buffer.toArray(sessionMessages);
            let sortedMessages = Array.sort<Message.Message>(
              messagesArray,
              func (a, b) {
                if (a.createdAt < b.createdAt) { #less } 
                else if (a.createdAt > b.createdAt) { #greater } 
                else { #equal }
              }
            );
            
            #ok((session, user, sortedMessages))
          };
        }
      };
    }
  };
  
  // Get session history for a user
  public func getHistory(
    session : Session.Session,
    sessions : HashMap.HashMap<Text, Session.Session>
  ) : [Session.Session] {
    let historyBuffer = Buffer.Buffer<Session.Session>(0);
    
    for (s in sessions.vals()) {
      if (s.userId == session.userId and s.id != session.id) {
        historyBuffer.add(s);
      };
    };
    
    // Sort by createdAt in descending order
    let historyArray = Buffer.toArray(historyBuffer);
    Array.sort<Session.Session>(
      historyArray,
      func (a, b) {
        if (a.createdAt > b.createdAt) { #less } 
        else if (a.createdAt < b.createdAt) { #greater } 
        else { #equal }
      }
    )
  };
  
  // Update session with doctor diagnosis
  public func doctorDiagnose(
    sessionId : Text,
    diagnosis : Text,
    sessions : HashMap.HashMap<Text, Session.Session>
  ) : Result.Result<(), Error> {
    switch (sessions.get(sessionId)) {
      case (null) {
        #err(#SessionNotFound("Session not found with ID: " # sessionId))
      };
      case (?session) {
        let updatedSession : Session.Session = {
          id = session.id;
          userId = session.userId;
          weight = session.weight;
          height = session.height;
          heartrate = session.heartrate;
          bodytemp = session.bodytemp;
          prediagnosis = session.prediagnosis;
          doctorDiagnosis = ?diagnosis;
          createdAt = session.createdAt;
          updatedAt = Time.now();
        };
        
        sessions.put(sessionId, updatedSession);
        #ok(())
      };
    }
  };
  
  // Get sessions by user ID
  public func getSessionsByUserID(
    userId : Text,
    sessions : HashMap.HashMap<Text, Session.Session>
  ) : [Session.Session] {
    let userSessionsBuffer = Buffer.Buffer<Session.Session>(0);
    
    for (session in sessions.vals()) {
      if (session.userId == userId) {
        userSessionsBuffer.add(session);
      };
    };
    
    Buffer.toArray(userSessionsBuffer)
  };
  
  // Helper function to build system prompt
  private func buildSystemPrompt(
    session : Session.Session,
    user : User.User,
    doctors : HashMap.HashMap<Text, Doctor.Doctor>
  ) : Text {
    // Get user data text
    let userDataText = "\nHere's the user's data: \n\n" #
      "Name:" # user.name # "\n" #
      "Age:" # calculateAge(user.dob) # "\n" #
      "Gender:" # user.gender # "\n" #
      "Nationality:" # user.nationality # "\n" #
      "Weight: " # Float.toText(session.weight) # "\n" #
      "Height: " # Float.toText(session.height) # "\n" #
      "Heartrate: " # Float.toText(session.heartrate) # "\n" #
      "Bodytemp: " # Float.toText(session.bodytemp) # "\n";
    
    // Get doctor list text
    let doctorListBuffer = Buffer.Buffer<Text>(0);
    
    for (doctor in doctors.vals()) {
      doctorListBuffer.add("- [" # doctor.id # "] " # doctor.name # " (" # doctor.specialty # ")\n");
    };
    
    let doctorListText = "\nHere are the doctors available [ID] Name (Specialty):\n" # 
      Text.join("", doctorListBuffer.vals());
    
    // Get current time as a formatted string
    let now = Time.now();
    let currentTimeText = formatTimestamp(now);
    
    // Hard-coded system prompt (simplified for Motoko compatibility)
    let systemPrompt = "You are a health expert fluent in Indonesian, passionate about helping patients understand their symptoms and connect them with the right doctor. Your goal is to guide patients step-by-step, choose a doctor based on their symptoms and the available doctor list, and ensure they feel comfortable and informed. Follow the JSON output format: {\"next_action\": \"CONTINUE_CHAT\" or \"APPOINTMENT\", \"reply\": \"Your text reply here\", \"doctor_id\": \"selected doctor_id\", \"prediagnosis\": \"Your pre-diagnosis\"}. For CONTINUE_CHAT, ask follow-up questions. For APPOINTMENT, include doctor_id and prediagnosis.";
    
    // Combine all parts of the system prompt
    systemPrompt # userDataText # doctorListText # "\nCurrent Time: " # currentTimeText
  };
  
  // Helper function to calculate age from date of birth
  private func calculateAge(dob : Text) : Text {
    // This is a simplified calculation
    // In a real implementation, parse the date and calculate the actual age
    let currentYear = 2025; // Hard-coded for demonstration
    
    switch (Text.split(dob, #char('-'))) {
      case (iter) {
        let array = Iter.toArray(iter);
        if (array.size() > 0) {
          switch (textToNat(array[0])) {
            case (?birthYear) {
              Int.toText(currentYear - birthYear)
            };
            case (null) {
              "Unknown"
            };
          }
        } else {
          "Unknown"
        };
      };
    };
  };
  
  // Helper function to convert text to Nat
  private func textToNat(text : Text) : ?Nat {
    var value : Nat = 0;
    for (c in text.chars()) {
      if (c >= '0' and c <= '9') {
        value := value * 10 + Nat32.toNat(Char.toNat32(c) - Char.toNat32('0'));
      } else {
        return null;
      };
    };
    ?value
  };
  
  // Helper function to format timestamp as a readable date/time string
  private func formatTimestamp(timestamp : Int) : Text {
    // This is a simplified implementation
    // In a real implementation, convert the nanoseconds to a proper date/time format
    Int.toText(timestamp / 1_000_000_000) # " (seconds since epoch)"
  };
  
  // Helper function to create Gemini API request JSON
  private func createGeminiRequestJson(
    systemPrompt : Text, 
    history : [{role : Text; text : Text}], 
    newMessage : Text
  ) : Text {
    // This is a simplified implementation
    // In a real implementation, use a proper JSON serialization library
    
    // Create contents array
    var contentsJson = "[";
    
    // Add system instruction
    contentsJson := contentsJson # "{\"role\":\"user\",\"parts\":[{\"text\":\"" # 
      escapeJsonString(systemPrompt) # "\"}]}";
    
    // Add history messages
    for (message in history.vals()) {
      let role = if (message.role == "omsapa") { "model" } else { message.role };
      contentsJson := contentsJson # ",{\"role\":\"" # role # "\",\"parts\":[{\"text\":\"" # 
        escapeJsonString(message.text) # "\"}]}";
    };
    
    // Add new user message
    contentsJson := contentsJson # ",{\"role\":\"user\",\"parts\":[{\"text\":\"" # 
      escapeJsonString(newMessage) # "\"}]}";
    
    contentsJson := contentsJson # "]";
    
    // Create the full request JSON
    let requestJson = "{" #
      "\"contents\":" # contentsJson # "," #
      "\"generationConfig\":{" #
        "\"temperature\":0.8," #
        "\"topP\":0.95," #
        "\"maxOutputTokens\":8192," #
        "\"responseMimeType\":\"application/json\"," #
        "\"responseSchema\":{" #
          "\"type\":\"OBJECT\"," #
          "\"properties\":{" #
            "\"next_action\":{\"type\":\"STRING\",\"enum\":[\"CONTINUE_CHAT\",\"APPOINTMENT\"]}," #
            "\"reply\":{\"type\":\"STRING\"}," #
            "\"doctor_id\":{\"type\":\"STRING\"}," #
            "\"prediagnosis\":{\"type\":\"STRING\"}" #
          "}," #
          "\"required\":[\"next_action\",\"reply\",\"doctor_id\",\"prediagnosis\"]" #
        "}" #
      "}" #
    "}";
    
    requestJson
  };
  
  // Helper function to escape JSON strings
  private func escapeJsonString(text : Text) : Text {
    var result = text;
    result := Text.replace(result, #text("\\"), "\\\\");
    result := Text.replace(result, #text("\""), "\\\"");
    result := Text.replace(result, #text("\n"), "\\n");
    result := Text.replace(result, #text("\r"), "\\r");
    result := Text.replace(result, #text("\t"), "\\t");
    result
  };
}
