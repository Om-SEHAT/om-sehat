// Doctor model in Motoko
import Text "mo:base/Text";

module {
  // Doctor model type definition
  public type Doctor = {
    id : Text;
    name : Text;
    email : Text;
    specialty : Text;
    roomNo : Text;
  };
}
