// User model in Motoko
import Text "mo:base/Text";

module {
  // User model type definition
  public type User = {
    id : Text;
    name : Text;
    email : Text;
    nationality : Text;
    dob : Text;        // Date of birth as string (YYYY-MM-DD)
    gender : Text;
    otp : ?Text;       // Optional OTP field
    createdAt : Int;   // Timestamp in nanoseconds
    updatedAt : Int;   // Timestamp in nanoseconds
  };
}
