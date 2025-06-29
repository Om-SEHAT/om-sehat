// Queue model in Motoko
import Text "mo:base/Text";

module {
  // Reference to foreign key IDs
  public type DoctorId = Text;
  public type SessionId = Text;
  
  // Queue model type definition
  public type Queue = {
    id : Text;
    doctorId : DoctorId;
    sessionId : SessionId;
    number : Int;
    createdAt : Int;  // Timestamp in nanoseconds
    updatedAt : Int;  // Timestamp in nanoseconds
  };
}
