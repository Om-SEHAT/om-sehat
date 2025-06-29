// Email schema in Motoko
import Text "mo:base/Text";

module {
  public type Email = {
    to : Text;
    from : Text;
    subject : Text;
    body : Text;
    html : ?Text;
    cc : ?[Text];
    bcc : ?[Text];
  };
}
