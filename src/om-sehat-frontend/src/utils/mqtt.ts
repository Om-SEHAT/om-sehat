/**
 * MQTT utility for communicating with IoT devices
 */
import mqtt from "mqtt";

// MQTT Broker Configuration
const MQTT_BROKER_URL =
  import.meta.env.VITE_MQTT_BROKER_URL || "ws://broker.emqx.io:8083/mqtt";
const MQTT_CLIENT_ID =
  import.meta.env.VITE_MQTT_CLIENT_ID || "mqtt-explorer-15d2ce5e"; // Use your specific ID or allow override via env var

console.log("[MQTT] Using client ID:", MQTT_CLIENT_ID);

// Topics
export const MQTT_TOPICS = {
  // Subscribe topics
  MAX_DATA: "omsehat/omsapa/max_data", // Heart rate and SpO2 data from MAX30102 sensor
  MLX_DATA: "omsehat/omsapa/mlx_data", // Temperature data from MLX90614 sensor

  // Publish topics
  REQUEST: "omsehat/omsapa/request", // Request specific sensor data
};

// Data interfaces
export interface MaxSensorData {
  heartRate: number;
  spo2: number;
}

export interface MlxSensorData {
  temp: number;
}

export interface SensorRequest {
  request_sensor: "max" | "mlx";
}

/**
 * MQTT client singleton
 */
class MqttClient {
  private client: mqtt.MqttClient | null = null;
  private connected: boolean = false;
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();

  /**
   * Connect to MQTT broker
   */
  connect(): Promise<boolean> {
    console.log("[MQTT] Attempting to connect to MQTT broker...");
    return new Promise((resolve) => {
      if (this.isConnected()) {
        // Use isConnected for a more reliable check
        console.log("[MQTT] Already connected to MQTT broker.");
        resolve(true);
        return;
      }

      // If there's an old client instance that's not connected, end it before creating a new one.
      if (this.client) {
        console.log(
          "[MQTT] Ending previous client instance before reconnecting."
        );
        this.client.end(true); // Force end previous client
        this.client = null;
      }

      this.client = mqtt.connect(MQTT_BROKER_URL, {
        clientId: MQTT_CLIENT_ID,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
      });

      this.client.on("connect", () => {
        console.log("[MQTT] Successfully connected to MQTT broker.");
        this.connected = true;
        resolve(true);
      });

      this.client.on("error", (err) => {
        console.error("[MQTT] Connection error:", err);
        this.connected = false;
        resolve(false);
      });

      this.client.on("message", (topic, message) => {
        const messageStr = message.toString();
        console.log(
          `[MQTT] Received message on topic '${topic}': ${messageStr}`
        );
        try {
          const parsedMessage = JSON.parse(messageStr);
          const topicListeners = this.listeners.get(topic);
          if (topicListeners && topicListeners.length > 0) {
            console.log(
              `[MQTT] Calling ${topicListeners.length} listener(s) for topic '${topic}' with data:`,
              parsedMessage
            );
            topicListeners.forEach((callback) => {
              try {
                callback(parsedMessage);
              } catch (e) {
                console.error(
                  `[MQTT] Error in listener for topic '${topic}':`,
                  e
                );
              }
            });
          } else {
            console.log(`[MQTT] No listeners found for topic '${topic}'.`);
          }
        } catch (error) {
          console.error(
            `[MQTT] Error parsing MQTT message from topic '${topic}':`,
            error
          );
        }
      });

      this.client.on("reconnect", () => {
        console.log("[MQTT] Client attempting to reconnect...");
        this.connected = false;
      });

      this.client.on("offline", () => {
        console.log("[MQTT] Client is offline.");
        this.connected = false;
      });

      this.client.on("close", () => {
        console.log("[MQTT] Connection closed.");
        this.connected = false;
      });
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect(): void {
    console.log("[MQTT] Attempting to disconnect from MQTT broker...");
    if (this.client) {
      this.client.end(false, () => {
        console.log("[MQTT] Successfully disconnected from MQTT broker.");
      });
      this.connected = false;
      this.listeners.clear();
      console.log("[MQTT] All listeners cleared.");
      this.client = null;
    } else {
      console.log("[MQTT] No active client to disconnect.");
    }
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string): Promise<void> {
    console.log(`[MQTT] Attempting to subscribe to topic: '${topic}'`);
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        const errMsg = "MQTT client not connected. Cannot subscribe.";
        console.warn(`[MQTT] ${errMsg}`);
        reject(new Error(errMsg));
        return;
      }
      if (!this.client) {
        // Should be caught by isConnected, but as a safeguard
        const errMsg = "MQTT client instance not available. Cannot subscribe.";
        console.warn(`[MQTT] ${errMsg}`);
        reject(new Error(errMsg));
        return;
      }

      this.client.subscribe(topic, { qos: 0 }, (err, granted) => {
        if (err) {
          console.error(`[MQTT] Error subscribing to '${topic}':`, err);
          reject(err);
          return;
        }
        console.log(
          `[MQTT] Successfully subscribed to '${topic}'. Granted:`,
          granted
        );
        resolve();
      });
    });
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: string): Promise<void> {
    console.log(`[MQTT] Attempting to unsubscribe from topic: '${topic}'`);
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        const errMsg = "MQTT client not connected. Cannot unsubscribe.";
        console.warn(`[MQTT] ${errMsg}`);
        // If not connected, arguably there's nothing to unsubscribe from the broker's perspective for this session.
        // However, rejecting makes it clear the command wasn't actively performed.
        reject(new Error(errMsg));
        return;
      }
      if (!this.client) {
        const errMsg =
          "MQTT client instance not available. Cannot unsubscribe.";
        console.warn(`[MQTT] ${errMsg}`);
        reject(new Error(errMsg));
        return;
      }

      this.client.unsubscribe(topic, (err) => {
        if (err) {
          console.error(`[MQTT] Error unsubscribing from '${topic}':`, err);
          reject(err);
          return;
        }
        console.log(`[MQTT] Successfully unsubscribed from '${topic}'.`);
        resolve();
      });
    });
  }

  /**
   * Publish a message to a topic
   */
  publish(topic: string, message: unknown): Promise<void> {
    console.log(
      `[MQTT] Attempting to publish to topic '${topic}' with message:`,
      message
    );
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        const errMsg = "MQTT client not connected. Cannot publish.";
        console.warn(`[MQTT] ${errMsg}`);
        reject(new Error(errMsg));
        return;
      }
      if (!this.client) {
        const errMsg = "MQTT client instance not available. Cannot publish.";
        console.warn(`[MQTT] ${errMsg}`);
        reject(new Error(errMsg));
        return;
      }

      try {
        const messageString =
          message === null || typeof message !== "object"
            ? String(message)
            : JSON.stringify(message);

        console.log(`[MQTT] Publishing stringified message: ${messageString}`);
        this.client.publish(topic, messageString, { qos: 0 }, (err) => {
          if (err) {
            console.error(`[MQTT] Error publishing to '${topic}':`, err);
            reject(err);
            return;
          }
          console.log(`[MQTT] Successfully published to '${topic}'.`);
          resolve();
        });
      } catch (error) {
        console.error(
          `[MQTT] Error preparing message for publishing to '${topic}':`,
          error
        );
        reject(error);
      }
    });
  }

  /**
   * Add a listener for a specific topic
   */
  addListener(topic: string, callback: (data: unknown) => void): void {
    console.log(`[MQTT] Adding listener for topic: '${topic}'`);
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, []);
    }

    const topicListeners = this.listeners.get(topic) as ((
      data: unknown
    ) => void)[]; // Type assertion
    if (!topicListeners.includes(callback)) {
      topicListeners.push(callback);
      console.log(
        `[MQTT] Listener added. Now ${topicListeners.length} listener(s) for topic '${topic}'.`
      );
    } else {
      console.log(
        `[MQTT] Listener already exists for topic '${topic}'. Not adding duplicate.`
      );
    }
  }

  /**
   * Remove a listener for a specific topic
   */
  removeListener(topic: string, callback: (data: unknown) => void): void {
    console.log(`[MQTT] Attempting to remove listener for topic: '${topic}'`);
    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      const index = topicListeners.indexOf(callback);
      if (index !== -1) {
        topicListeners.splice(index, 1);
        console.log(
          `[MQTT] Listener removed for topic '${topic}'. Remaining: ${topicListeners.length}.`
        );
        if (topicListeners.length === 0) {
          this.listeners.delete(topic);
          console.log(
            `[MQTT] No listeners remaining for topic '${topic}', removed topic from listeners map.`
          );
        }
      } else {
        console.log(
          `[MQTT] Listener not found for removal on topic '${topic}'.`
        );
      }
    } else {
      console.log(
        `[MQTT] No listeners map found for topic '${topic}' during removal attempt.`
      );
    }
  }

  /**
   * Request data from a specific sensor
   */
  requestSensorData(sensor: "max" | "mlx"): Promise<void> {
    console.log(`[MQTT] Requesting sensor data for: ${sensor}`);
    const request: SensorRequest = {
      request_sensor: sensor,
    };
    return this.publish(MQTT_TOPICS.REQUEST, request);
  }

  /**
   * Check if the client is currently connected.
   */
  isConnected(): boolean {
    const status =
      this.client !== null && this.client.connected && this.connected;
    // console.log(`[MQTT] isConnected check: ${status}`); // Can be noisy, enable if needed for debugging
    return status;
  }
}

// Export singleton instance
export const mqttClient = new MqttClient();

/**
 * Custom hook for using MQTT in components
 */
export const useMqtt = () => {
  console.log('[MQTT] useMqtt hook called.'); // Can be noisy
  return {
    connect: mqttClient.connect.bind(mqttClient),
    disconnect: mqttClient.disconnect.bind(mqttClient),
    subscribe: mqttClient.subscribe.bind(mqttClient),
    unsubscribe: mqttClient.unsubscribe.bind(mqttClient),
    publish: mqttClient.publish.bind(mqttClient),
    addListener: mqttClient.addListener.bind(mqttClient),
    removeListener: mqttClient.removeListener.bind(mqttClient),
    requestSensorData: mqttClient.requestSensorData.bind(mqttClient),
    isConnected: mqttClient.isConnected.bind(mqttClient),
  };
};

export default mqttClient;