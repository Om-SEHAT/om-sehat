// OTP Service in Motoko
import User "../models/User";
import Session "../models/Session";
import OTPInput "../schemas/OTPInput";
import Validation "../schemas/Validation";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Nat8 "mo:base/Nat8";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Random "mo:base/Random";
import Blob "mo:base/Blob";
import Error "mo:base/Error";
import IC "ic:aaaaa-aa";
import Debug "mo:base/Debug";

module {
  // Generate a random 6-digit OTP
  public func generateOTP() : async Text {
    // Get random bytes from the system entropy
    let blob = await Random.blob();
    
    // Convert the random bytes to a number and take modulo 1000000 to get a 6-digit number
    let random_bytes = Blob.toArray(blob);
    if (random_bytes.size() == 0) {
      return "000000"; // Fallback in case random generation fails
    };
    
    // Use the first byte to generate a number
    let n = Nat8.toNat(random_bytes[0]);
    
    // Create a 6-digit number based on timestamp and random byte
    let timestamp = Time.now();
    let combined = Int.abs(timestamp) + n;
    
    // Get last 6 digits
    let otp_number = combined % 1000000;
    
    // Format as a 6-digit string with leading zeros if needed
    let otp_text = Int.toText(otp_number);
    
    // Add leading zeros if needed
    var padded_otp = otp_text;
    while (padded_otp.size() < 6) {
      padded_otp := "0" # padded_otp;
    };
    
    padded_otp;
  };

  // Find user by email
  public func findUserByEmail(
    users: HashMap.HashMap<Text, User.User>,
    email: Text
  ) : ?User.User {
    for (user in users.vals()) {
      if (user.email == email) {
        return ?user;
      };
    };
    null;
  };

  // Validate OTP and create a new session
  public func validateOTP(
    users: HashMap.HashMap<Text, User.User>,
    sessions: HashMap.HashMap<Text, Session.Session>,
    input: OTPInput.OTPInput
  ) : Result.Result<Session.Session, Text> {
    // Validate input
    let validationError = Validation.validateOTPInput(input);
    switch (validationError) {
      case (?error) { return #err(error); };
      case (null) { /* Continue with validation */ };
    };
    
    // Find user by email
    let foundUser = findUserByEmail(users, input.email);
    
    switch (foundUser) {
      case (null) {
        return #err("User not found with the provided email");
      };
      case (?user) {
        // Check if OTP matches
        switch (user.otp) {
          case (null) {
            return #err("No OTP has been generated for this user");
          };
          case (?otpValue) {
            if (otpValue != input.otp) {
              return #err("Invalid OTP");
            } else {
              // Create a new session
              let now = Time.now();
              let sessionId = Int.toText(now);
              
              let newSession : Session.Session = {
                id = sessionId;
                userId = user.id;
                weight = input.weight;
                height = input.height;
                heartrate = input.heartrate;
                bodytemp = input.bodytemp;
                prediagnosis = null;
                doctorDiagnosis = null;
                createdAt = now;
                updatedAt = now;
              };
              
              // Save the session
              sessions.put(sessionId, newSession);
              
              // Clear the OTP
              let updatedUser : User.User = {
                id = user.id;
                name = user.name;
                email = user.email;
                nationality = user.nationality;
                dob = user.dob;
                gender = user.gender;
                otp = null; // Clear the OTP
                createdAt = user.createdAt;
                updatedAt = now;
              };
              
              users.put(user.id, updatedUser);
              
              return #ok(newSession);
            };
          };
        };
      };
    };
  };

  // Send OTP via email using HTTP outcall
  // Send OTP via email using HTTP outcall
  public func sendOTPEmail(to : Text, otp : Text, token : Text) : async Text {
    let url = "https://smtp.sportsnow.app/send-email";
    
    // Get the HTML template with the OTP injected
    let htmlContent = injectOtpIntoHtml(otp);
    
    // Properly escape JSON special characters in the HTML
    let escapedHtml = Text.replace(htmlContent, #text("\""), "\\\"");
    let escapedHtml2 = Text.replace(escapedHtml, #text("\n"), "\\n");
    
    // Create properly formatted JSON
    let requestBodyJson = "{\"to\":\"" # to # 
        "\",\"from\":\"omsehat@sportsnow.app" # 
        "\",\"subject\":\"Your OTP Code" # 
        "\",\"body\":\"Your OTP is: " # otp # 
        "\",\"html\":\"" # escapedHtml2 # "\"}";
    
    let requestBody = Text.encodeUtf8(requestBodyJson);
    
    // Debug the request body
    Debug.print("Request body: " # requestBodyJson);
    
    // Prepare request headers
    let requestHeaders = [
        { name = "Content-Type"; value = "application/json" },
        { name = "Authorization"; value = "Bearer " # token },
    ];

    let httpRequest : IC.http_request_args = {
        url = url;
        max_response_bytes = null;
        headers = requestHeaders;
        body = ?requestBody;
        method = #post;
        transform = null;
    };

    // Send the request with cycles
    let httpResponse : IC.http_request_result = await (with cycles = 230_949_972_000) IC.http_request(httpRequest);

    // Check for non-success status codes
    if (httpResponse.status >= 400) {
        // Get the response body for more details about the error
        let errorBody = switch (Text.decodeUtf8(httpResponse.body)) {
        case (null) { "No response body" };
        case (?text) { text };
        };
        
        throw Error.reject("Error from email service: " # 
        debug_show(httpResponse.status) # 
        " - Response: " # errorBody);
    };

    // Decode the successful response
    let responseBody : Text = switch (Text.decodeUtf8(httpResponse.body)) {
        case (null) { "No response body" };
        case (?text) { text };
    };

    responseBody;
  };

  public func injectOtpIntoHtml(otpCode: Text) : Text {
    // In a real application, we would load a template from an asset canister
    // For now, we'll use a more comprehensive HTML template with the OTP code
    let htmlTemplate = "<!DOCTYPE html>
<html lang='en'>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Your OTP Code</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        color: #333;
      }

      .container {
        background-color: #ffffff;
        padding: 20px;
        margin: 0 auto;
        margin-top: 20px;
        max-width: 400px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
      }

      .otp-code {
        font-size: 36px;
        font-weight: bold;
        letter-spacing: 4px;
        margin: 20px 0;
        color: #444444;
      }

      .instructions {
        font-size: 14px;
        color: #666666;
      }

      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #888888;
      }
    </style>
  </head>

  <body>
    <div class='container'>
      <h2>Your OTP Code</h2>
      <div class='otp-code'>{{otp_code}}</div>
      <p class='footer'>
        This is an automated email, please do not reply. If you didn\'t request
        this, please ignore this email.
      </p>
    </div>
  </body>
</html>";
    
    // Replace the placeholder with the OTP code
    Text.replace(htmlTemplate, #text("{{otp_code}}"), otpCode);
  };
}
