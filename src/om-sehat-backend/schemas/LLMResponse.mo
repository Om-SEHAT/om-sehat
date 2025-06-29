// LLMResponse schema in Motoko
import Text "mo:base/Text";

module {
  public type LLMResponse = {
    nextAction : Text;
    reply : Text;
    doctorId : Text;
    preDiagnosis : Text;
  };
}
