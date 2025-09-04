/*
 * University Classroom Attendance System - ESP32 Complete Implementation
 * 
 * Hardware Requirements:
 * - ESP32 Development Board (ESP32-WROOM-32)
 * - MFRC522 RFID Reader Module
 * - RFID Cards/Tags for professors and students
 * - 2x LEDs (Green for success, Red for error)
 * - 1x Buzzer for audio feedback
 * - 2x 220Ω resistors for LEDs
 * 
 * Wiring (ESP32 to MFRC522):
 * - VCC -> 3.3V
 * - GND -> GND
 * - SDA -> GPIO 21
 * - SCK -> GPIO 18
 * - MOSI -> GPIO 23
 * - MISO -> GPIO 19
 * - RST -> GPIO 22
 * 
 * LED and Buzzer Wiring:
 * - Green LED: GPIO 2 -> 220Ω -> LED -> GND
 * - Red LED: GPIO 4 -> 220Ω -> LED -> GND
 * - Buzzer: GPIO 5 -> Buzzer -> GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <EEPROM.h>

// ============================================================================
// CONFIGURATION SECTION - UPDATE THESE VALUES
// ============================================================================

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";           // Replace with your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";    // Replace with your WiFi password

// Supabase Configuration
const char* supabaseUrl = "https://putjlurgkhdmdwhepgqq.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpsdXJna2hkbWR3aGVwZ3FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcyNTg5NCwiZXhwIjoyMDcyMzAxODk0fQ.XfXHqA_4rtpj16Tg6x2xLlGsjUUtjCBqSpXc6xgtnJg";

// Device Configuration
const char* deviceId = "ESP32_001_A101";       // Change this to match your classroom
const char* deviceName = "Classroom A101";     // Human-readable name

// ============================================================================
// PIN DEFINITIONS
// ============================================================================

#define SS_PIN 21      // RFID SDA pin
#define RST_PIN 22     // RFID RST pin
#define LED_SUCCESS 2  // Green LED for success
#define LED_ERROR 4    // Red LED for errors
#define BUZZER_PIN 5   // Buzzer pin
#define LED_WIFI 13    // Blue LED for WiFi status

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

MFRC522 mfrc522(SS_PIN, RST_PIN);

// WiFi and connection management
bool wifiConnected = false;
unsigned long lastWiFiCheck = 0;
const unsigned long WIFI_CHECK_INTERVAL = 30000; // Check WiFi every 30 seconds

// RFID scan management
String lastScannedCard = "";
unsigned long lastScanTime = 0;
const unsigned long SCAN_COOLDOWN = 3000; // 3 seconds between scans

// System status
unsigned long systemStartTime = 0;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 60000; // Send heartbeat every minute
// Tracks outcome of last end-session attempt to prevent accidental re-start
bool lastProfessorEndTooEarly = false;

// EEPROM addresses
#define EEPROM_SIZE 512
#define EEPROM_WIFI_SSID 0
#define EEPROM_WIFI_PASS 32

// ============================================================================
// SETUP FUNCTION
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("========================================");
  Serial.println("University Attendance System Starting...");
  Serial.println("========================================");
  
  // Initialize EEPROM
  EEPROM.begin(EEPROM_SIZE);
  
  // Initialize pins
  initializePins();
  
  // Initialize RFID reader
  initializeRFID();
  
  // Connect to WiFi
  connectToWiFi();
  
  // Initialize system
  systemStartTime = millis();
  
  Serial.println("System Ready!");
  Serial.println("Waiting for RFID cards...");
  Serial.println("========================================");
  
  // Success indication
  successFeedback();
  
  // Send initial heartbeat
  sendHeartbeat();
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  // Check WiFi connection periodically
  if (millis() - lastWiFiCheck > WIFI_CHECK_INTERVAL) {
    checkWiFiConnection();
    lastWiFiCheck = millis();
  }
  
  // Send heartbeat to server
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Check for new RFID card
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String rfidTag = getRFIDString();
    
    // Prevent duplicate scans
    if (rfidTag == lastScannedCard && (millis() - lastScanTime) < SCAN_COOLDOWN) {
      Serial.println("Duplicate scan ignored");
      return;
    }
    
    lastScannedCard = rfidTag;
    lastScanTime = millis();
    
    Serial.println("========================================");
    Serial.println("Card detected: " + rfidTag);
    Serial.println("Processing...");
    
    // Process the RFID scan
    processRFIDScan(rfidTag);
    
    // Stop reading
    mfrc522.PICC_HaltA();
    
    Serial.println("========================================");
  }
  
  delay(100);
}

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

void initializePins() {
  pinMode(LED_SUCCESS, OUTPUT);
  pinMode(LED_ERROR, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_WIFI, OUTPUT);
  
  // Turn off all LEDs initially
  digitalWrite(LED_SUCCESS, LOW);
  digitalWrite(LED_ERROR, LOW);
  digitalWrite(LED_WIFI, LOW);
  
  Serial.println("Pins initialized");
}

void initializeRFID() {
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Set antenna gain
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
  
  Serial.println("RFID reader initialized");
  Serial.println("MFRC522 Version: " + String(mfrc522.PCD_ReadRegister(mfrc522.VersionReg), HEX));
}

// ============================================================================
// WIFI MANAGEMENT
// ============================================================================

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println();
    Serial.println("WiFi connected successfully!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength: ");
    Serial.println(WiFi.RSSI());
    
    digitalWrite(LED_WIFI, HIGH);
  } else {
    wifiConnected = false;
    Serial.println();
    Serial.println("WiFi connection failed!");
    digitalWrite(LED_WIFI, LOW);
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Attempting to reconnect...");
    wifiConnected = false;
    digitalWrite(LED_WIFI, LOW);
    connectToWiFi();
  } else if (!wifiConnected) {
    wifiConnected = true;
    digitalWrite(LED_WIFI, HIGH);
    Serial.println("WiFi reconnected!");
  }
}

// ============================================================================
// RFID PROCESSING
// ============================================================================

String getRFIDString() {
  String content = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    content.concat(String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : ""));
    content.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  content.toUpperCase();
  return content;
}

void processRFIDScan(String rfidTag) {
  if (!wifiConnected) {
    Serial.println("Error: WiFi not connected");
    errorFeedback();
    return;
  }
  
  // First, try to END an existing professor session (respects minimum duration)
  if (endProfessorSession(rfidTag)) {
    Serial.println("✅ Professor session ended successfully!");
    successFeedback();
    return;
  }

  // If ending failed due to minimum duration, do NOT start a new session
  if (lastProfessorEndTooEarly) {
    Serial.println("⏳ Cannot end session yet: minimum duration not reached");
    errorFeedback();
    return;
  }

  // If no active session to end, try to START a new professor session
  if (startProfessorSession(rfidTag)) {
    Serial.println("✅ Professor session started successfully!");
    successFeedback();
    return;
  }
  
  // If not a professor, try to record student attendance
  if (recordStudentAttendance(rfidTag)) {
    Serial.println("✅ Student attendance recorded successfully!");
    successFeedback();
    return;
  }
  
  // If neither worked, show error
  Serial.println("❌ RFID tag not recognized or no active session");
  errorFeedback();
}

// ============================================================================
// SUPABASE API FUNCTIONS
// ============================================================================

bool startProfessorSession(String rfidTag) {
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/rpc/start_professor_session");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("apikey", supabaseKey);
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["p_professor_rfid"] = rfidTag;
  doc["p_classroom_device_id"] = deviceId;
  doc["p_subject"] = ""; // Let database function determine subject from timetable
  doc["p_late_threshold"] = 1;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Starting professor session...");
  Serial.println("Payload: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response Code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    
    // Parse response
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"] == true) {
      Serial.println("Professor: " + responseDoc["professor_name"].as<String>());
      Serial.println("Classroom: " + responseDoc["classroom_name"].as<String>());
      Serial.println("Subject: " + responseDoc["subject"].as<String>());
      Serial.println("Session ID: " + responseDoc["session_id"].as<String>());
      http.end();
      return true;
    } else {
      Serial.println("Error: " + responseDoc["error"].as<String>());
    }
  } else {
    Serial.println("HTTP Error: " + String(httpResponseCode));
  }
  
  http.end();
  return false;
}

bool endProfessorSession(String rfidTag) {
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/rpc/end_professor_session");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("apikey", supabaseKey);
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["p_professor_rfid"] = rfidTag;
  doc["p_classroom_device_id"] = deviceId;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Ending professor session...");
  Serial.println("Payload: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response Code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    
    // Parse response
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    
    // Reset flag by default; set to true only for minimum-duration violation
    lastProfessorEndTooEarly = false;

    if (responseDoc["success"] == true) {
      Serial.println("Session ended successfully!");
      Serial.println("Professor: " + responseDoc["professor_name"].as<String>());
      Serial.println("Session duration: " + responseDoc["duration_minutes"].as<String>() + " minutes");
      http.end();
      return true;
    } else {
      String err = responseDoc["error"].as<String>();
      Serial.println("Error: " + err);
      if (err.indexOf("must run for at least") >= 0 || err.indexOf("minimum") >= 0) {
        lastProfessorEndTooEarly = true;
      }
    }
  } else {
    Serial.println("HTTP Error: " + String(httpResponseCode));
  }
  
  http.end();
  return false;
}

bool recordStudentAttendance(String rfidTag) {
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/rpc/record_student_attendance");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("apikey", supabaseKey);
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["p_student_rfid"] = rfidTag;
  doc["p_classroom_device_id"] = deviceId;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Recording student attendance...");
  Serial.println("Payload: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response Code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    
    // Parse response
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"] == true) {
      Serial.println("Student: " + responseDoc["student_name"].as<String>());
      Serial.println("Student Number: " + responseDoc["student_number"].as<String>());
      Serial.println("Status: " + responseDoc["status"].as<String>());
      Serial.println("Timestamp: " + responseDoc["timestamp"].as<String>());
      http.end();
      return true;
    } else {
      Serial.println("Error: " + responseDoc["error"].as<String>());
    }
  } else {
    Serial.println("HTTP Error: " + String(httpResponseCode));
  }
  
  http.end();
  return false;
}

void sendHeartbeat() {
  if (!wifiConnected) {
    return;
  }
  
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/device_heartbeats");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("apikey", supabaseKey);
  
  // Create heartbeat payload
  DynamicJsonDocument doc(512);
  doc["device_id"] = deviceId;
  doc["device_name"] = deviceName;
  doc["status"] = "online";
  doc["uptime_seconds"] = (millis() - systemStartTime) / 1000;
  doc["wifi_strength"] = WiFi.RSSI();
  doc["ip_address"] = WiFi.localIP().toString();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.println("Heartbeat sent successfully");
  } else {
    Serial.println("Heartbeat failed: " + String(httpResponseCode));
  }
  
  http.end();
}

// ============================================================================
// FEEDBACK FUNCTIONS
// ============================================================================

void successFeedback() {
  // Green LED and success beep
  digitalWrite(LED_SUCCESS, HIGH);
  tone(BUZZER_PIN, 1000, 200);  // High pitch beep
  delay(500);
  digitalWrite(LED_SUCCESS, LOW);
}

void errorFeedback() {
  // Red LED and error beeps
  digitalWrite(LED_ERROR, HIGH);
  tone(BUZZER_PIN, 500, 100);   // Low pitch beep
  delay(150);
  tone(BUZZER_PIN, 500, 100);   // Second beep
  delay(500);
  digitalWrite(LED_ERROR, LOW);
}

void blinkLED(int pin, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(200);
    digitalWrite(pin, LOW);
    delay(200);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

void printSystemInfo() {
  Serial.println("========================================");
  Serial.println("System Information:");
  Serial.println("Device ID: " + String(deviceId));
  Serial.println("Device Name: " + String(deviceName));
  Serial.println("WiFi SSID: " + String(ssid));
  Serial.println("WiFi Status: " + String(wifiConnected ? "Connected" : "Disconnected"));
  Serial.println("IP Address: " + WiFi.localIP().toString());
  Serial.println("Signal Strength: " + String(WiFi.RSSI()) + " dBm");
  Serial.println("Uptime: " + String((millis() - systemStartTime) / 1000) + " seconds");
  Serial.println("Free Heap: " + String(ESP.getFreeHeap()) + " bytes");
  Serial.println("========================================");
}

// ============================================================================
// DEBUG COMMANDS (via Serial Monitor)
// ============================================================================

void handleSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "info") {
      printSystemInfo();
    } else if (command == "wifi") {
      checkWiFiConnection();
    } else if (command == "heartbeat") {
      sendHeartbeat();
    } else if (command == "restart") {
      ESP.restart();
    } else if (command == "help") {
      Serial.println("Available commands:");
      Serial.println("info - Print system information");
      Serial.println("wifi - Check WiFi connection");
      Serial.println("heartbeat - Send heartbeat to server");
      Serial.println("restart - Restart ESP32");
      Serial.println("help - Show this help");
    }
  }
}
