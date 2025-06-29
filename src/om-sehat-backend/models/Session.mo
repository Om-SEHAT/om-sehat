// Session model in Motoko
import Text "mo:base/Text";
import Float "mo:base/Float";

module {
  // Session model type definition
  public type Session = {
    id : Text;
    userId : Text;  // Reference to a User
    weight : Float;
    height : Float;
    heartrate : Float;
    bodytemp : Float;
    prediagnosis : ?Text;  // Optional field
    doctorDiagnosis : ?Text;  // Optional field
    createdAt : Int;  // Timestamp in nanoseconds
    updatedAt : Int;  // Timestamp in nanoseconds
  };
}
