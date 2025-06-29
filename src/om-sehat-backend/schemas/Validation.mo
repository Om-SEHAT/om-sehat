// Validation utilities for schemas
import Text "mo:base/Text";
import Char "mo:base/Char";
import Nat "mo:base/Nat";

module {
  // Check if a string is not empty
  public func isNotEmpty(text : Text) : Bool {
    text.size() > 0
  };
  
  // Simple email validation
  public func isValidEmail(email : Text) : Bool {
    if (not isNotEmpty(email)) {
      return false;
    };
    
    let chars = email.chars();
    var hasAtSymbol = false;
    var hasDotAfterAt = false;
    var atPosition : Nat = 0;
    var dotPosition : Nat = 0;
    var position : Nat = 0;
    
    for (char in chars) {
      if (char == '@') {
        hasAtSymbol := true;
        atPosition := position;
      };
      
      if (hasAtSymbol and char == '.') {
        hasDotAfterAt := true;
        dotPosition := position;
      };
      
      position += 1;
    };
    
    // Basic check: has @ symbol, has dot after @, and has characters before @ and between @ and .
    if (not hasAtSymbol or not hasDotAfterAt) {
      return false;
    };
    
    if (atPosition == 0) {
      return false;
    };
    
    if (dotPosition <= atPosition + 1) {
      return false;
    };
    
    if (position <= dotPosition + 1) {
      return false;
    };
    
    return true;
  };
  
  // Validate date format (YYYY-MM-DD)
  public func isValidDate(date : Text) : Bool {
    if (date.size() != 10) {
      return false;
    };
    
    let chars = date.chars();
    var position = 0;
    
    for (char in chars) {
      if (position == 4 or position == 7) {
        if (char != '-') {
          return false;
        };
      } else {
        if (not Char.isDigit(char)) {
          return false;
        };
      };
      
      position += 1;
    };
    
    true
  };
  
  // Validate OTPInput
  public func validateOTPInput(input : {
    name : Text;
    email : Text;
    nationality : Text;
    dob : Text;
    weight : Float;
    height : Float;
    heartrate : Float;
    bodytemp : Float;
    gender : Text;
    otp : Text;
  }) : ?Text {
    if (not isNotEmpty(input.name)) {
      return ?"Name is required";
    };
    
    if (not isValidEmail(input.email)) {
      return ?"Invalid email format";
    };
    
    if (not isNotEmpty(input.nationality)) {
      return ?"Nationality is required";
    };
    
    if (not isValidDate(input.dob)) {
      return ?"Invalid date format (use YYYY-MM-DD)";
    };
    
    if (input.weight <= 0) {
      return ?"Weight must be positive";
    };
    
    if (input.height <= 0) {
      return ?"Height must be positive";
    };
    
    if (input.heartrate <= 0) {
      return ?"Heart rate must be positive";
    };
    
    if (input.bodytemp <= 0) {
      return ?"Body temperature must be positive";
    };
    
    if (not isNotEmpty(input.gender)) {
      return ?"Gender is required";
    };
    
    if (not isNotEmpty(input.otp)) {
      return ?"OTP is required";
    };
    
    null
  };
  
  // Validate RegisterUserInput
  public func validateRegisterUserInput(input : {
    name : Text;
    email : Text;
    nationality : Text;
    dob : Text;
    weight : Float;
    height : Float;
    heartrate : Float;
    bodytemp : Float;
    gender : Text;
  }) : ?Text {
    if (not isNotEmpty(input.name)) {
      return ?"Name is required";
    };
    
    if (not isValidEmail(input.email)) {
      return ?"Invalid email format";
    };
    
    if (not isNotEmpty(input.nationality)) {
      return ?"Nationality is required";
    };
    
    if (not isValidDate(input.dob)) {
      return ?"Invalid date format (use YYYY-MM-DD)";
    };
    
    if (input.weight <= 0) {
      return ?"Weight must be positive";
    };
    
    if (input.height <= 0) {
      return ?"Height must be positive";
    };
    
    if (input.heartrate <= 0) {
      return ?"Heart rate must be positive";
    };
    
    if (input.bodytemp <= 0) {
      return ?"Body temperature must be positive";
    };
    
    if (not isNotEmpty(input.gender)) {
      return ?"Gender is required";
    };
    
    null
  };
  
  // Validate SessionChatInput
  public func validateSessionChatInput(input : {
    newMessage : Text;
  }) : ?Text {
    if (not isNotEmpty(input.newMessage)) {
      return ?"Message is required";
    };
    
    null
  };
  
  // Validate Email
  public func validateEmail(input : {
    to : Text;
    from : ?Text;
    subject : Text;
    body : Text;
    html : ?Text;
    cc : ?[Text];
    bcc : ?[Text];
  }) : ?Text {
    if (not isValidEmail(input.to)) {
      return ?"Invalid recipient email";
    };
    
    switch (input.from) {
      case (null) {};
      case (?from) {
        if (not isValidEmail(from)) {
          return ?"Invalid sender email";
        };
      };
    };
    
    if (not isNotEmpty(input.subject)) {
      return ?"Subject is required";
    };
    
    if (not isNotEmpty(input.body)) {
      return ?"Body is required";
    };
    
    null
  };
}
