// Main canister for Om-Sehat backend
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Array "mo:base/Array";

// Import schemas
import RegisterUserInput "./schemas/RegisterUserInput";
import OTPInput "./schemas/OTPInput";

// Import models
import Doctor "./models/Doctor";
import User "./models/User";
import Session "./models/Session";
import Queue "./models/Queue";
import Message "./models/Message";

// Import controllers
import DoctorController "./controllers/DoctorController";
import QueueController "./controllers/QueueController";
import SessionController "./controllers/SessionController";
import UserController "./controllers/UserController";

actor OmSehatBackend {
  // Define persistent storage
  stable var doctorsStable : [Doctor.Doctor] = [];
  stable var usersEntries : [(Text, User.User)] = [];
  stable var sessionsEntries : [(Text, Session.Session)] = [];
  stable var queuesEntries : [(Text, Queue.Queue)] = [];
  stable var messagesEntries : [(Text, Message.Message)] = [];
  
  // Initialize in-memory data structures
  var doctors : [Doctor.Doctor] = doctorsStable;
  var users = HashMap.fromIter<Text, User.User>(Iter.fromArray(usersEntries), 10, Text.equal, Text.hash);
  var sessions = HashMap.fromIter<Text, Session.Session>(Iter.fromArray(sessionsEntries), 10, Text.equal, Text.hash);
  var queues = HashMap.fromIter<Text, Queue.Queue>(Iter.fromArray(queuesEntries), 10, Text.equal, Text.hash);
  var messages = HashMap.fromIter<Text, Message.Message>(Iter.fromArray(messagesEntries), 10, Text.equal, Text.hash);
  
  // System initialization and upgrade logic
  system func preupgrade() {
    // Prepare stable storage before upgrade
    doctorsStable := doctors;
    usersEntries := Iter.toArray(users.entries());
    sessionsEntries := Iter.toArray(sessions.entries());
    queuesEntries := Iter.toArray(queues.entries());
    messagesEntries := Iter.toArray(messages.entries());
  };
  
  system func postupgrade() {
    // Reinitialize data structures after upgrade (if needed)
  };
  
  // Doctor Controller Endpoints
  
  // Doctor Diagnose endpoint
  public func doctorDiagnose(sessionId : Text, diagnosis : Text) : async Result.Result<Text, Text> {
    let input : DoctorController.DiagnosisInput = {
      diagnosis = diagnosis;
    };
    
    switch (DoctorController.doctorDiagnose(sessionId, input, sessions)) {
      case (#ok(message)) {
        #ok(message)
      };
      case (#err(error)) {
        switch (error) {
          case (#NotFound(msg)) {
            #err("Not Found: " # msg)
          };
          case (#InvalidInput(msg)) {
            #err("Invalid Input: " # msg)
          };
          case (#InternalError(msg)) {
            #err("Internal Error: " # msg)
          };
        }
      };
    }
  };
  
  // Get All Doctors endpoint
  public query func getAllDoctors() : async Result.Result<[Doctor.Doctor], Text> {
    switch (DoctorController.getAllDoctors(doctors)) {
      case (#ok(doctorsList)) {
        #ok(doctorsList)
      };
      case (#err(error)) {
        switch (error) {
          case (#NotFound(msg)) {
            #err("Not Found: " # msg)
          };
          case (#InvalidInput(msg)) {
            #err("Invalid Input: " # msg)
          };
          case (#InternalError(msg)) {
            #err("Internal Error: " # msg)
          };
        }
      };
    }
  };
  
  // Get Doctor Details endpoint
  public query func getDoctorDetails(doctorId : Text) : async Result.Result<DoctorController.DoctorDetailsResponse, Text> {
    switch (DoctorController.getDoctorDetails(doctorId, doctors, queues, sessions)) {
      case (#ok(response)) {
        #ok(response)
      };
      case (#err(error)) {
        switch (error) {
          case (#NotFound(msg)) {
            #err("Not Found: " # msg)
          };
          case (#InvalidInput(msg)) {
            #err("Invalid Input: " # msg)
          };
          case (#InternalError(msg)) {
            #err("Internal Error: " # msg)
          };
        }
      };
    }
  };
  
  // Add more controller endpoints here as needed
  
  // Queue Controller Endpoints
  
  // Get Current Queue endpoint
  public query func getCurrentQueue(doctorId : Text) : async Result.Result<QueueController.QueueResponse, Text> {
    switch (QueueController.getCurrentQueue(doctorId, queues, sessions)) {
      case (#ok(response)) {
        #ok(response)
      };
      case (#err(error)) {
        switch (error) {
          case (#NotFound(msg)) {
            #err("Not Found: " # msg)
          };
          case (#InvalidInput(msg)) {
            #err("Invalid Input: " # msg)
          };
          case (#InternalError(msg)) {
            #err("Internal Error: " # msg)
          };
        }
      };
    }
  };
  
  // Session Controller Endpoints
  
  // Generate Session Response endpoint
  public func generateSessionResponse(sessionId : Text, newMessage : Text, geminiApiKey : Text, emailToken : Text) : async Result.Result<SessionController.LLMSessionResponse, Text> {
    let input : SessionController.GenerateSessionInput = {
      newMessage = newMessage;
    };
    
    switch (await SessionController.generateSessionResponse(
      sessionId, 
      input, 
      sessions, 
      users, 
      messages, 
      queues, 
      HashMap.fromIter<Text, Doctor.Doctor>(Iter.fromArray(Array.map<Doctor.Doctor, (Text, Doctor.Doctor)>(doctors, func(doc) { (doc.id, doc) })), 10, Text.equal, Text.hash),
      geminiApiKey,
      emailToken
    )) {
      case (#ok(response)) {
        #ok(response)
      };
      case (#err(error)) {
        switch (error) {
          case (#NotFound(msg)) {
            #err("Not Found: " # msg)
          };
          case (#InvalidInput(msg)) {
            #err("Invalid Input: " # msg)
          };
          case (#CompletedSession(msg)) {
            #err("Completed Session: " # msg)
          };
          case (#InternalError(msg)) {
            #err("Internal Error: " # msg)
          };
          case (#LLMError(msg)) {
            #err("LLM Error: " # msg)
          };
          case (#InvalidNextAction(msg)) {
            #err("Invalid Next Action: " # msg)
          };
          case (#JSONParsingError(msg)) {
            #err("JSON Parsing Error: " # msg)
          };
        }
      };
    }
  };
  
  // Get Active Session endpoint
  public query func getActiveSession(sessionId : Text) : async Result.Result<SessionController.SessionResponse, Text> {
    switch (SessionController.getActiveSession(sessionId, sessions, users, messages)) {
      case (#ok(response)) {
        #ok(response)
      };
      case (#err(error)) {
        switch (error) {
          case (#NotFound(msg)) {
            #err("Not Found: " # msg)
          };
          case (#InvalidInput(msg)) {
            #err("Invalid Input: " # msg)
          };
          case (#CompletedSession(msg)) {
            #err("Completed Session: " # msg)
          };
          case (#InternalError(msg)) {
            #err("Internal Error: " # msg)
          };
          case (#LLMError(msg)) {
            #err("LLM Error: " # msg)
          };
          case (#InvalidNextAction(msg)) {
            #err("Invalid Next Action: " # msg)
          };
          case (#JSONParsingError(msg)) {
            #err("JSON Parsing Error: " # msg)
          };
        }
      };
    }
  };
  
  // User Controller Endpoints
  
  // Register User endpoint
  public func registerUser(input : RegisterUserInput.RegisterUserInput, emailToken : Text) : async Result.Result<UserController.RegisterResponse, Text> {
    switch (await UserController.registerUser(input, users, emailToken)) {
      case (#ok(response)) {
        #ok(response)
      };
      case (#err(error)) {
        switch (error) {
          case (#NotFound(msg)) {
            #err("Not Found: " # msg)
          };
          case (#InvalidInput(msg)) {
            #err("Invalid Input: " # msg)
          };
          case (#ValidationFailed(msg)) {
            #err("Validation Failed: " # msg)
          };
          case (#InternalError(msg)) {
            #err("Internal Error: " # msg)
          };
        }
      };
    }
  };
  
  // Verify OTP endpoint
  public func verifyOTP(input : OTPInput.OTPInput) : async Result.Result<UserController.VerifyOTPResponse, Text> {
    switch (UserController.verifyOTP(input, users, sessions)) {
      case (#ok(response)) {
        #ok(response)
      };
      case (#err(error)) {
        switch (error) {
          case (#NotFound(msg)) {
            #err("Not Found: " # msg)
          };
          case (#InvalidInput(msg)) {
            #err("Invalid Input: " # msg)
          };
          case (#ValidationFailed(msg)) {
            #err("Validation Failed: " # msg)
          };
          case (#InternalError(msg)) {
            #err("Internal Error: " # msg)
          };
        }
      };
    }
  };
  
  // Get User Details endpoint
  public query func getUserDetails(userId : Text) : async Result.Result<UserController.UserDetailsResponse, Text> {
    switch (UserController.getUserDetails(userId, users, sessions, queues)) {
      case (#ok(response)) {
        #ok(response)
      };
      case (#err(error)) {
        switch (error) {
          case (#NotFound(msg)) {
            #err("Not Found: " # msg)
          };
          case (#InvalidInput(msg)) {
            #err("Invalid Input: " # msg)
          };
          case (#ValidationFailed(msg)) {
            #err("Validation Failed: " # msg)
          };
          case (#InternalError(msg)) {
            #err("Internal Error: " # msg)
          };
        }
      };
    }
  };
}
