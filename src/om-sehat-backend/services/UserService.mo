// UserService module in Motoko
import Text "mo:base/Text";
import Time "mo:base/Time";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Debug "mo:base/Debug";
import Int "mo:base/Int";
import Error "mo:base/Error";

import User "../models/User";
import RegisterUserInput "../schemas/RegisterUserInput";
import Validation "../schemas/Validation";
import OTPService "./OTPService";

module {
  // Error types for the UserService
  public type Error = {
    #UserCreationFailed : Text;
    #UserUpdateFailed : Text;
    #EmailSendingFailed : Text;
    #ValidationFailed : Text;
    #InternalError : Text;
  };

  // Register a new user or update an existing one
  public func registerUser(
    users: HashMap.HashMap<Text, User.User>,
    input: RegisterUserInput.RegisterUserInput,
    emailToken: Text
  ) : async Result.Result<User.User, Error> {
    // Validate the input
    let validationError = validateRegisterUserInput(input);
    switch (validationError) {
      case (?error) {
        return #err(#ValidationFailed(error));
      };
      case (null) {
        // Input is valid, continue with registration
      };
    };

    // Generate an OTP
    let otp = await OTPService.generateOTP();
    
    // Check if user already exists
    let existingUser = OTPService.findUserByEmail(users, input.email);
    
    let now = Time.now();
    let user : User.User = switch (existingUser) {
      case (null) {
        // Create a new user with a simple ID based on timestamp and random value
        {
          id = generateUserId(now);
          name = input.name;
          email = input.email;
          nationality = input.nationality;
          dob = input.dob;
          gender = input.gender;
          otp = ?otp;
          createdAt = now;
          updatedAt = now;
        }
      };
      case (?existing) {
        // Update existing user
        {
          id = existing.id;
          name = input.name;
          email = input.email;
          nationality = input.nationality;
          dob = input.dob;
          gender = input.gender;
          otp = ?otp;
          createdAt = existing.createdAt;
          updatedAt = now;
        }
      };
    };
    
    // Save or update the user in the HashMap
    users.put(user.id, user);
    
    // Send OTP email
    try {
      let _ = await OTPService.sendOTPEmail(user.email, otp, emailToken);
    } catch (e) {
      Debug.print("Error sending OTP email: " # Error.message(e));
      // We don't fail the registration if email sending fails
      // Just log the error and continue
    };
    
    #ok(user)
  };

  // Get a user by their ID
  public func getUserByID(
    users: HashMap.HashMap<Text, User.User>,
    userID: Text
  ) : ?User.User {
    users.get(userID)
  };

  // Helper function to validate the registration input
  private func validateRegisterUserInput(input: RegisterUserInput.RegisterUserInput) : ?Text {
    if (not Validation.isNotEmpty(input.name)) {
      return ?"Name is required";
    };
    
    if (not Validation.isValidEmail(input.email)) {
      return ?"Invalid email format";
    };
    
    if (not Validation.isNotEmpty(input.nationality)) {
      return ?"Nationality is required";
    };
    
    if (not Validation.isValidDate(input.dob)) {
      return ?"Invalid date of birth format. Expected YYYY-MM-DD";
    };
    
    if (not Validation.isNotEmpty(input.gender)) {
      return ?"Gender is required";
    };
    
    null
  };
  
  // Generate a simple ID for a user based on timestamp
  private func generateUserId(timestamp: Int) : Text {
    "user-" # Int.toText(timestamp)
  };
}
