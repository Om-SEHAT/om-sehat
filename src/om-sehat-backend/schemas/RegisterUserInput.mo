// RegisterUserInput schema in Motoko
import Text "mo:base/Text";
import Float "mo:base/Float";

module {
  public type RegisterUserInput = {
    name : Text;
    email : Text;
    nationality : Text;
    dob : Text;
    weight : Float;
    height : Float;
    heartrate : Float;
    bodytemp : Float;
    gender : Text;
  };
}
