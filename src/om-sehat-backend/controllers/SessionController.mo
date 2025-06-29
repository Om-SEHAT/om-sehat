// SessionController module in Motoko
import Result "mo:base/Result";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";

import Session "../models/Session";
import User "../models/User";
import Message "../models/Message";
import Queue "../models/Queue";
import Doctor "../models/Doctor";
import LLMResponse "../schemas/LLMResponse";

import SessionService "../services/SessionService";
import QueueService "../services/QueueService";

module {
  // Define error types
  public type Error = {
    #NotFound : Text;
    #InvalidInput : Text;
    #CompletedSession : Text;
    #InternalError : Text;
    #LLMError : Text;
    #InvalidNextAction : Text;
    #JSONParsingError : Text;
  };
  
  // Define input types
  public type GenerateSessionInput = {
    newMessage : Text;
  };
  
  // Define response types
  public type SessionResponse = {
    session : Session.Session;
    user : User.User;
    messages : [Message.Message];
  };
  
  public type LLMSessionResponse = {
    message : Text;
    nextAction : Text;
    reply : Text;
    sessionId : Text;
    queue : ?Queue.Queue;
    currentQueue : ?Queue.Queue;
  };

  // Function to generate a session response (LLM interaction)
  public func generateSessionResponse(
    sessionId : Text,
    input : GenerateSessionInput,
    sessions : HashMap.HashMap<Text, Session.Session>,
    users : HashMap.HashMap<Text, User.User>,
    messages : HashMap.HashMap<Text, Message.Message>,
    queues : HashMap.HashMap<Text, Queue.Queue>,
    doctors : HashMap.HashMap<Text, Doctor.Doctor>,
    geminiApiKey : Text,
    emailToken : Text
  ) : async Result.Result<LLMSessionResponse, Error> {
    // 1. Get the session data
    switch (SessionService.getSessionData(sessionId, sessions, users, messages)) {
      case (#err(error)) {
        switch (error) {
          case (#SessionNotFound(msg)) {
            return #err(#NotFound("Session not found"));
          };
          case (_) {
            return #err(#InternalError("Error retrieving session"));
          };
        };
      };
      case (#ok((session, user, sessionMessages))) {
        // 2. Get LLM response
        let llmResult = await SessionService.getLLMResponse(
          input.newMessage,
          session,
          user,
          sessionMessages,
          doctors,
          geminiApiKey
        );
        
        switch (llmResult) {
          case (#err(error)) {
            let errorMsg = switch (error) { 
                case (#LLMRequestFailed(msg)) { msg };
                case (_) { "Unknown error" };
              };
            return #err(#LLMError("Error getting LLM response: " # errorMsg));
          };
          case (#ok(llmResponseText)) {
            // 3. Parse the LLM response
            let parseResult = parseJSON(llmResponseText);
            
            switch (parseResult) {
              case (#err(error)) {
                return #err(error);
              };
              case (#ok(llmResponse)) {
                Debug.print("LLM Response Next Action: " # llmResponse.nextAction);
                Debug.print("LLM Response Doctor ID: " # llmResponse.doctorId);
                Debug.print("LLM Response: " # llmResponse.reply);
                
                // Variables for queue handling
                var queue : ?Queue.Queue = null;
                var currentQueue : ?Queue.Queue = null;
                
                // 4. Process next action
                if (llmResponse.nextAction == "CONTINUE_CHAT") {
                  // Just continue, no additional action needed
                } else if (llmResponse.nextAction == "APPOINTMENT") {
                  // Create queue
                  let queueResult = QueueService.generateQueue(queues, sessionId, llmResponse.doctorId);
                  
                  switch (queueResult) {
                    case (#err(qError)) {
                      let errorMsg = switch (qError) {
                        case (#QueueCreationFailed(msg)) { msg };
                        case (#InvalidSessionID(msg)) { msg };
                        case (#InvalidDoctorID(msg)) { msg };
                        case (_) { "Unknown error" };
                      };
                      return #err(#InternalError("Error generating queue: " # errorMsg));
                    };
                    case (#ok(newQueue)) {
                      queue := ?newQueue;
                      
                      // Get the doctor info
                      let doctorOpt = doctors.get(llmResponse.doctorId);
                      
                      switch (doctorOpt) {
                        case (null) {
                          return #err(#NotFound("Doctor not found"));
                        };
                        case (?doctor) {
                          // Get current queue
                          let currentQueueResult = QueueService.getCurrentQueue(queues, sessions, llmResponse.doctorId);
                          
                          switch (currentQueueResult) {
                            case (#err(_)) {
                              // If no current queue, use the new queue's number
                              currentQueue := queue;
                            };
                            case (#ok(cQueue)) {
                              currentQueue := ?cQueue;
                              
                              // Send email notification
                              try {
                                let emailResult = await QueueService.sendQueueEmail(
                                  user.email,
                                  newQueue.number,
                                  cQueue.number,
                                  emailToken,
                                  doctor
                                );
                                
                                switch (emailResult) {
                                  case (#err(eError)) {
                                    let errorMsg = switch (eError) {
                                      case (#EmailSendingFailed(msg)) { msg };
                                      case (_) { "Unknown error" };
                                    };
                                    Debug.print("Error sending email: " # errorMsg);
                                  };
                                  case (_) {
                                    // Email sent successfully
                                  };
                                };
                              } catch (_) {
                                Debug.print("Exception sending email");
                              };
                            };
                          };
                          
                          // Update the session's prediagnosis
                          let updatedSession : Session.Session = {
                            id = session.id;
                            userId = session.userId;
                            weight = session.weight;
                            height = session.height;
                            heartrate = session.heartrate;
                            bodytemp = session.bodytemp;
                            prediagnosis = ?llmResponse.preDiagnosis;
                            doctorDiagnosis = session.doctorDiagnosis;
                            createdAt = session.createdAt;
                            updatedAt = Time.now();
                          };
                          
                          sessions.put(session.id, updatedSession);
                        };
                      };
                    };
                  };
                } else {
                  return #err(#InvalidNextAction("Invalid next action: " # llmResponse.nextAction));
                };
                
                // 5. Update chat history
                let chatResult = SessionService.updateChatHistory(
                  sessionId, 
                  input.newMessage, 
                  llmResponse.reply,
                  sessions,
                  messages
                );
                
                switch (chatResult) {
                  case (#err(cError)) {
                    let errorMsg = switch (cError) {
                      case (#MessageCreationFailed(msg)) { msg };
                      case (_) { "Unknown error" };
                    };
                    return #err(#InternalError("Error updating chat history: " # errorMsg));
                  };
                  case (#ok(_)) {
                    // 6. Return the response
                    #ok({
                      message = "Chat history updated successfully";
                      nextAction = llmResponse.nextAction;
                      reply = llmResponse.reply;
                      sessionId = sessionId;
                      queue = queue;
                      currentQueue = currentQueue;
                    })
                  };
                };
              };
            };
          };
        };
      };
    };
  };

  // Function to get an active session
  public func getActiveSession(
    sessionId : Text,
    sessions : HashMap.HashMap<Text, Session.Session>,
    users : HashMap.HashMap<Text, User.User>,
    messages : HashMap.HashMap<Text, Message.Message>
  ) : Result.Result<SessionResponse, Error> {
    // Get the session data
    switch (SessionService.getSessionData(sessionId, sessions, users, messages)) {
      case (#err(error)) {
        switch (error) {
          case (#SessionNotFound(msg)) {
            #err(#NotFound("Session not found"))
          };
          case (_) {
            #err(#InternalError("Error retrieving session"))
          };
        }
      };
      case (#ok((session, user, sessionMessages))) {
        // Check if session is active (prediagnosis is not done yet)
        switch (session.prediagnosis) {
          case (null) {
            // Session is active, return the data
            #ok({
              session = session;
              user = user;
              messages = sessionMessages;
            })
          };
          case (?prediagnosis) {
            if (prediagnosis == "") {
              // Empty string prediagnosis is still considered active
              #ok({
                session = session;
                user = user;
                messages = sessionMessages;
              })
            } else {
              // Non-empty prediagnosis means session is completed
              #err(#CompletedSession("Session is completed"))
            }
          };
        }
      };
    }
  };
  
  // Helper to parse JSON from LLM response text
  private func parseJSON(responseText : Text) : Result.Result<LLMResponse.LLMResponse, Error> {
    // Basic implementation to extract JSON content
    let nextAction = if (Text.contains(responseText, #text("CONTINUE_CHAT"))) {
      "CONTINUE_CHAT"
    } else if (Text.contains(responseText, #text("APPOINTMENT"))) {
      "APPOINTMENT"
    } else {
      "CONTINUE_CHAT" // Default to continue chat
    };
    
    // Very simplified extraction - in a real implementation use a proper JSON parser
    let reply = extractField(responseText, "reply");
    let doctorId = extractField(responseText, "doctor_id");
    let preDiagnosis = extractField(responseText, "prediagnosis");
    
    if (reply == "") {
      #err(#JSONParsingError("Failed to extract reply from JSON response"))
    } else {
      #ok({
        nextAction = nextAction;
        reply = reply;
        doctorId = doctorId;
        preDiagnosis = preDiagnosis;
      })
    }
  };
  
// Helper to extract field from JSON response
private func extractField(json : Text, fieldName : Text) : Text {
    // This is a very simplified implementation
    // In a real app, we would use a proper JSON library
    let searchString = "\"" # fieldName # "\"";
    
    let jsonChars = Text.toIter(json);
    let searchChars = Text.toIter(searchString);
    
    // Build a buffer to track matches with the search string
    var matchBuffer = Buffer.Buffer<Char>(0);
    var searchIter = searchChars;
    var found = false;
    var value = "";
    var inValue = false;
    var collectingValue = false;
    
    for (char in jsonChars) {
        // Match the search string
        if (not found) {
            // Try to match the next character in search string
            switch (searchIter.next()) {
                case (?expectedChar) {
                    if (char == expectedChar) {
                        matchBuffer.add(char);
                    } else {
                        // Reset matching
                        matchBuffer.clear();
                        searchIter := Text.toIter(searchString);
                    };
                };
                case (null) {
                    // Fully matched the search string
                    found := true;
                    matchBuffer.clear();
                };
            };
        } else if (not inValue and char == ':') {
            // Found the delimiter after field name
            inValue := true;
        } else if (inValue and (not collectingValue) and char == '\"') {
            // Start collecting the value
            collectingValue := true;
        } else if (inValue and collectingValue) {
            if (char == '\"') {
                // End of value
                return value;
            } else {
                // Append to value
                value := value # Text.fromChar(char);
            };
        };
    };
    
    // If we reach here, we didn't find a proper value
    return "";
};
}
