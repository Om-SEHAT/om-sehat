// Message model in Motoko
import Text "mo:base/Text";

module {
  // Reference to Session ID type
  public type SessionId = Text;
  
  // Message model type definition
  public type Message = {
    id : Text;
    role : Text;
    content : Text;
    sessionId : SessionId;
    createdAt : Int;  // Timestamp in nanoseconds
    updatedAt : Int;  // Timestamp in nanoseconds
  };
}
