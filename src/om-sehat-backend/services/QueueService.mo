// QueueService module in Motoko
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Order "mo:base/Order";
import Buffer "mo:base/Buffer";
import IC "ic:aaaaa-aa";

import Queue "../models/Queue";
import Doctor "../models/Doctor";
import Session "../models/Session";
import Email "../schemas/Email";

module {
  // Error types for the QueueService
  public type Error = {
    #InvalidSessionID : Text;
    #InvalidDoctorID : Text;
    #QueueCreationFailed : Text;
    #QueueNotFound : Text;
    #EmailSendingFailed : Text;
  };

  // Generate a new queue entry
  public func generateQueue(
    queues: HashMap.HashMap<Text, Queue.Queue>,
    sessionID: Text,
    doctorID: Text
  ) : Result.Result<Queue.Queue, Error> {
    // Validate the sessionID
    if (Text.size(sessionID) == 0) {
      return #err(#InvalidSessionID("Session ID cannot be empty"));
    };

    // Validate the doctorID
    if (Text.size(doctorID) == 0) {
      return #err(#InvalidDoctorID("Doctor ID cannot be empty"));
    };

    // Get the start of the current day (midnight)
    let now = Time.now();
    let todayStart = getDayStart(now);
    
    // Find the latest queue number for this doctor today
    var latestQueueNumber : Int = 0;
    
    for (queue in queues.vals()) {
      if (queue.doctorId == doctorID and queue.createdAt >= todayStart) {
        if (queue.number > latestQueueNumber) {
          latestQueueNumber := queue.number;
        };
      };
    };
    
    // Create the new queue with an incremented number
    let queueNumber = latestQueueNumber + 1;
    
    let newQueue : Queue.Queue = {
      id = generateQueueId(now);
      doctorId = doctorID;
      sessionId = sessionID;
      number = queueNumber;
      createdAt = now;
      updatedAt = now;
    };
    
    // Save the queue
    queues.put(newQueue.id, newQueue);
    
    #ok(newQueue)
  };

  // Get the current queue for a doctor
  public func getCurrentQueue(
    queues: HashMap.HashMap<Text, Queue.Queue>,
    sessions: HashMap.HashMap<Text, Session.Session>,
    doctorID: Text
  ) : Result.Result<Queue.Queue, Error> {
    let todayStart = getDayStart(Time.now());
    
    // Filter and collect queues for this doctor today into a buffer
    let doctorQueuesBuffer = Buffer.Buffer<Queue.Queue>(0);
    
    for (queue in queues.vals()) {
      if (queue.doctorId == doctorID and queue.createdAt >= todayStart) {
        doctorQueuesBuffer.add(queue);
      };
    };
    
    if (doctorQueuesBuffer.size() == 0) {
      return #err(#QueueNotFound("No queue found for this doctor today"));
    };
    
    // Convert buffer to array
    let doctorQueues = Buffer.toArray(doctorQueuesBuffer);
    
    // Sort queues by number (ascending)
    let sortedQueues = Array.sort<Queue.Queue>(
      doctorQueues,
      func (a: Queue.Queue, b: Queue.Queue) : Order.Order {
        if (a.number < b.number) { #less } 
        else if (a.number > b.number) { #greater } 
        else { #equal }
      }
    );
    
    // Find the first queue that hasn't been completed (no doctor diagnosis)
    for (queue in sortedQueues.vals()) {
      let sessionOpt = sessions.get(queue.sessionId);
      
      switch (sessionOpt) {
        case (null) {
          // Session not found, continue to next queue
        };
        case (?session) {
          switch (session.doctorDiagnosis) {
            case (null) {
              // Found a session without doctor diagnosis
              return #ok(queue);
            };
            case (?diagnosis) {
              if (diagnosis == "") {
                // Empty diagnosis string is considered incomplete
                return #ok(queue);
              };
              // Otherwise, this queue is complete, continue to next
            };
          };
        };
      };
    };
    
    #err(#QueueNotFound("No active queue found for this doctor"))
  };

  // Get total number of appointments for a doctor (all time)
  public func getTotalAppointments(
    queues: HashMap.HashMap<Text, Queue.Queue>,
    doctorID: Text
  ) : Int {
    var count = 0;
    
    for (queue in queues.vals()) {
      if (queue.doctorId == doctorID) {
        count += 1;
      };
    };
    
    count
  };

  // Get number of appointments for a doctor today
  public func getDailyAppointments(
    queues: HashMap.HashMap<Text, Queue.Queue>,
    doctorID: Text
  ) : Int {
    let todayStart = getDayStart(Time.now());
    var count = 0;
    
    for (queue in queues.vals()) {
      if (queue.doctorId == doctorID and queue.createdAt >= todayStart) {
        count += 1;
      };
    };
    
    count
  };

  // Send queue notification email
  public func sendQueueEmail(
    to: Text,
    queueNumber: Int,
    currentQueueNumber: Int,
    token: Text,
    doctor: Doctor.Doctor
  ) : async Result.Result<Text, Error> {
    let emailHTML = injectQueueIntoHTML(queueNumber, currentQueueNumber, doctor);
    
    // Create email object
    let email : Email.Email = {
      to = to;
      from = "omsehat@sportsnow.app";
      subject = "Queue Notification";
      body = "This is your queue number";
      html = ?emailHTML;
      cc = null;
      bcc = null;
    };
    
    // Convert email to JSON for the HTTP request
    let url = "https://smtp.sportsnow.app/send-email";
    
    // Properly escape JSON special characters in the HTML
    let escapedHtml = Text.replace(emailHTML, #text("\""), "\\\"");
    let escapedHtml2 = Text.replace(escapedHtml, #text("\n"), "\\n");
    
    // Create properly formatted JSON
    let requestBodyJson = "{\"to\":\"" # to # 
        "\",\"from\":\"" # email.from # 
        "\",\"subject\":\"" # email.subject # 
        "\",\"body\":\"" # email.body # 
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
        
        return #err(#EmailSendingFailed("Error from email service: " # 
          Int.toText(httpResponse.status) # 
          " - Response: " # errorBody));
    };

    // Decode the successful response
    let responseBody : Text = switch (Text.decodeUtf8(httpResponse.body)) {
        case (null) { "No response body" };
        case (?text) { text };
    };

    #ok(responseBody)
  };

  // Get queue by session ID
  public func getQueueBySessionID(
    queues: HashMap.HashMap<Text, Queue.Queue>,
    sessionID: Text
  ) : ?Queue.Queue {
    var latestQueue : ?Queue.Queue = null;
    var latestTimestamp : Int = 0;
    
    for (queue in queues.vals()) {
      if (queue.sessionId == sessionID) {
        if (queue.createdAt > latestTimestamp) {
          latestTimestamp := queue.createdAt;
          latestQueue := ?queue;
        };
      };
    };
    
    latestQueue
  };

  // Helper function to get the start of a day (midnight)
  private func getDayStart(timestamp: Int) : Int {
    // Convert nanoseconds to seconds
    let seconds = timestamp / 1_000_000_000;
    
    // Calculate seconds since midnight
    let secondsInDay = 24 * 60 * 60;
    let secondsSinceMidnight = seconds % secondsInDay;
    
    // Get timestamp for midnight
    let midnightSeconds = seconds - secondsSinceMidnight;
    
    // Convert back to nanoseconds
    midnightSeconds * 1_000_000_000
  };

  // Generate a queue ID based on timestamp
  private func generateQueueId(timestamp: Int) : Text {
    "queue-" # Int.toText(timestamp)
  };

  // HTML template for queue notification
  private func injectQueueIntoHTML(queueNumber: Int, currentQueueNumber: Int, doctor: Doctor.Doctor) : Text {
    let htmlTemplate = "<!DOCTYPE html>
<html lang='en'>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Queue Notification</title>
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
        max-width: 600px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .header {
        text-align: center;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
      }

      .queue-info {
        margin: 30px 0;
        text-align: center;
      }

      .queue-number {
        font-size: 36px;
        font-weight: bold;
        color: #4a6fa5;
        margin: 10px 0;
      }

      .current-queue {
        font-size: 16px;
        color: #666;
        margin: 10px 0;
      }

      .doctor-info {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
      }

      .doctor-info h3 {
        margin-top: 0;
        color: #555;
      }

      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #888888;
        text-align: center;
      }
    </style>
  </head>

  <body>
    <div class='container'>
      <div class='header'>
        <h2>Queue Notification</h2>
      </div>
      
      <div class='queue-info'>
        <p>Your queue number is:</p>
        <div class='queue-number'>{{queue_number}}</div>
        <p class='current-queue'>Current queue being served: {{current_queue_number}}</p>
      </div>
      
      <div class='doctor-info'>
        <h3>Doctor Information</h3>
        <p><strong>Name:</strong> {{doctor_name}}</p>
        <p><strong>Specialty:</strong> {{doctor_specialty}}</p>
        <p><strong>Room Number:</strong> {{room_number}}</p>
      </div>
      
      <p class='footer'>
        This is an automated email, please do not reply. If you didn't request
        this, please ignore this email.
      </p>
    </div>
  </body>
</html>";
    
    // Replace the placeholders with actual values
    var result = Text.replace(htmlTemplate, #text("{{queue_number}}"), Int.toText(queueNumber));
    result := Text.replace(result, #text("{{current_queue_number}}"), Int.toText(currentQueueNumber));
    result := Text.replace(result, #text("{{doctor_name}}"), doctor.name);
    result := Text.replace(result, #text("{{doctor_specialty}}"), doctor.specialty);
    result := Text.replace(result, #text("{{room_number}}"), doctor.roomNo);
    
    result
  };
}
