// UserController module in Motoko
import Text "mo:base/Text";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Array "mo:base/Array";
import Order "mo:base/Order";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Char "mo:base/Char";
import Nat32 "mo:base/Nat32";

import User "../models/User";
import Session "../models/Session";
import Queue "../models/Queue";
import RegisterUserInput "../schemas/RegisterUserInput";
import OTPInput "../schemas/OTPInput";
import UserService "../services/UserService";
import OTPService "../services/OTPService";
import SessionService "../services/SessionService";
import QueueService "../services/QueueService";

module {
  // Define error types
  public type Error = {
    #NotFound : Text;
    #InvalidInput : Text;
    #ValidationFailed : Text;
    #InternalError : Text;
  };
  
  // Define response types
  public type RegisterResponse = {
    message : Text;
    user : {
      id : Text;
      name : Text;
      email : Text;
    };
  };
  
  public type VerifyOTPResponse = {
    message : Text;
    session : Session.Session;
  };
  
  public type SessionHistory = {
    sessionId : Text;
    bodytemp : Float;
    doctorDiagnosis : ?Text;
    heartrate : Float;
    height : Float;
    prediagnosis : ?Text;
    weight : Float;
    createdAt : Int;
  };
  
  public type CurrentSession = {
    queue : ?Queue.Queue;
    sessionId : Text;
    bodytemp : Float;
    doctorDiagnosis : ?Text;
    heartrate : Float;
    height : Float;
    prediagnosis : ?Text;
    weight : Float;
    createdAt : Int;
  };
  
  public type UserDetailsResponse = {
    user : {
      id : Text;
      name : Text;
      email : Text;
      gender : Text;
      nationality : Text;
      age : Text;
    };
    currentSession : ?CurrentSession;
    historySessions : [SessionHistory];
  };
  
  // Function to register a user
  public func registerUser(
    input : RegisterUserInput.RegisterUserInput,
    users : HashMap.HashMap<Text, User.User>,
    emailToken : Text
  ) : async Result.Result<RegisterResponse, Error> {
    switch (await UserService.registerUser(users, input, emailToken)) {
      case (#ok(user)) {
        #ok({
          message = "User registered successfully";
          user = {
            id = user.id;
            name = user.name;
            email = user.email;
          };
        })
      };
      case (#err(error)) {
        switch (error) {
          case (#ValidationFailed(msg)) {
            #err(#ValidationFailed(msg))
          };
          case (_) {
            #err(#InternalError("Failed to register user"))
          };
        }
      };
    }
  };
  
  // Function to verify OTP
  public func verifyOTP(
    input : OTPInput.OTPInput,
    users : HashMap.HashMap<Text, User.User>,
    sessions : HashMap.HashMap<Text, Session.Session>
  ) : Result.Result<VerifyOTPResponse, Error> {
    switch (OTPService.validateOTP(users, sessions, input)) {
      case (#ok(session)) {
        #ok({
          message = "OTP verified successfully";
          session = session;
        })
      };
      case (#err(msg)) {
        #err(#ValidationFailed(msg))
      };
    }
  };
  
  // Function to get user details
  public func getUserDetails(
    userId : Text,
    users : HashMap.HashMap<Text, User.User>,
    sessions : HashMap.HashMap<Text, Session.Session>,
    queues : HashMap.HashMap<Text, Queue.Queue>
  ) : Result.Result<UserDetailsResponse, Error> {
    // Get user by ID
    switch (UserService.getUserByID(users, userId)) {
      case (null) {
        #err(#NotFound("User not found"))
      };
      case (?user) {
        // Get sessions for the user
        let userSessions = SessionService.getSessionsByUserID(userId, sessions);
        
        if (userSessions.size() == 0) {
          #err(#NotFound("No sessions found for the user"))
        } else {
          // Prepare to find the latest session
          var latestTimestamp = -9223372036854775808; // Int.min_value
          var latestSession : ?Session.Session = null;
          let historySessionsBuffer = Buffer.Buffer<SessionHistory>(0);
          
          // First pass: find the latest session
          for (session in userSessions.vals()) {
            if (session.createdAt > latestTimestamp) {
              latestTimestamp := session.createdAt;
              latestSession := ?session;
            };
          };
          
          // Second pass: collect all sessions except the latest into history
          for (session in userSessions.vals()) {
            if (session.createdAt != latestTimestamp) {
              historySessionsBuffer.add({
                sessionId = session.id;
                bodytemp = session.bodytemp;
                doctorDiagnosis = session.doctorDiagnosis;
                heartrate = session.heartrate;
                height = session.height;
                prediagnosis = session.prediagnosis;
                weight = session.weight;
                createdAt = session.createdAt;
              });
            };
          };
          
          // Sort history sessions by createdAt in descending order
          let historySessionsArray = Buffer.toArray(historySessionsBuffer);
          let sortedHistory = Array.sort(historySessionsArray, func (a : SessionHistory, b : SessionHistory) : Order.Order {
            if (a.createdAt > b.createdAt) { #less }
            else if (a.createdAt < b.createdAt) { #greater }
            else { #equal }
          });
          
          // Create the current session data
          var currentSessionData : ?CurrentSession = null;
          switch (latestSession) {
            case (null) {
              // This shouldn't happen given our earlier check, but handle it anyway
            };
            case (?session) {
              // Find queue for this session
              var sessionQueue : ?Queue.Queue = null;
              for (queue in queues.vals()) {
                if (queue.sessionId == session.id) {
                  sessionQueue := ?queue;
                };
              };
              
              currentSessionData := ?{
                queue = sessionQueue;
                sessionId = session.id;
                bodytemp = session.bodytemp;
                doctorDiagnosis = session.doctorDiagnosis;
                heartrate = session.heartrate;
                height = session.height;
                prediagnosis = session.prediagnosis;
                weight = session.weight;
                createdAt = session.createdAt;
              };
            };
          };
          
          // Calculate age from date of birth
          let age = calculateAge(user.dob);
          
          #ok({
            user = {
              id = user.id;
              name = user.name;
              email = user.email;
              gender = user.gender;
              nationality = user.nationality;
              age = age;
            };
            currentSession = currentSessionData;
            historySessions = sortedHistory;
          })
        };
      };
    }
  };
  
  // Helper function to calculate age from date of birth
  func calculateAge(dob : Text) : Text {
    // This is a simplified calculation
    // In a real implementation, parse the date and calculate the actual age
    let currentYear = 2025; // Hard-coded for demonstration
    
    let iter = Text.split(dob, #char('-'));
    let array = Iter.toArray(iter);
    if (array.size() > 0) {
      let birthYearText = array[0];
      var birthYear = 0;
      var digit = 0;
      
      for (char in birthYearText.chars()) {
        if (char >= '0' and char <= '9') {
          digit := Nat32.toNat(Char.toNat32(char) - Char.toNat32('0'));
          birthYear := birthYear * 10 + digit;
        };
      };
      
      if (birthYear > 0) {
        Int.toText(currentYear - birthYear)
      } else {
        "Unknown"
      };
    } else {
      "Unknown"
    };
  };
}
