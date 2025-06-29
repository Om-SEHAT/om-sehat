// Message schema in Motoko
import Text "mo:base/Text";

module {
  public type MessageSchema = {
    role : Text;
    content : Text;
  };
}
