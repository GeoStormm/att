/*
 * University Classroom Attendance System - ESP32 Code
 * 
 * Hardware Requirements:
 * - ESP32 Development Board
 * - MFRC522 RFID Reader
 * - RFID Cards/Tags for professors and students
 * 
 * Wiring (ESP32 to MFRC522):
 * - VCC -> 3.3V
 * - GND -> GND
 * - SDA -> GPIO 21
 * - SCK -> GPIO 18
 * - MOSI -> GPIO 23
 * - MISO -> GPIO 19
 * - RST -> GPIO 22
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>

// RFID Configuration
#define SS_PIN 21
#define RST_PIN 22
MFRC522 mfrc522(SS_PIN, RST_PIN);

// WiFi Configuration (from .env file)
const char* ssid = "HUAWEI-2.4G-VCt5";
const char* password = "Ayoub@Anas.2023";

// Supabase Configuration
const char* supabaseUrl = "https://putjlurgkhdmdwhepgqq.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpsdXJna2hkbWR3aGVwZ3FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcyNTg5NCwiZXhwIjoyMDcyMzAxODk0fQ.XfXHqA_4rtpj16Tg6x2xLlGsjUUtjCBqSpXc6xgtnJg";

// Device Configuration
const char* deviceId = "ESP32_001_A101";

// LED Pins for status indication
#define LED_SUCCESS 2   // Green LED
#define LED_ERROR 4     // Red LED
#define BUZZER_PIN 5    // Buzzer for audio feedback

// Global variables
String lastScannedCard = "";
unsigned long lastScanTime = 0;
const unsigned long SCAN_COOLDOWN = 3000; // 3 seconds between scans

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED_SUCCESS, OUTPUT);
  pinMode(LED_ERROR, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Initialize SPI and RFID
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("University Attendance System Ready!");
  Serial.println("Waiting for RFID cards...");
  
  // Success indication
  blinkLED(LED_SUCCESS, 3);
}

void loop() {
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
    
    Serial.println("Card detected: " + rfidTag);
    
    // Process the RFID scan
    processRFIDScan(rfidTag);
    
    // Stop reading
    mfrc522.PICC_HaltA();
  }
  
  delay(100);
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

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
  // First, try to start a professor session
  if (startProfessorSession(rfidTag)) {
    Serial.println("Professor session started successfully!");
    successFeedback();
    return;
  }
  
  // If not a professor, try to record student attendance
  if (recordStudentAttendance(rfidTag)) {
    Serial.println("Student attendance recorded successfully!");
    successFeedback();
    return;
  }
  
  // If neither worked, show error
  Serial.println("RFID tag not recognized or no active session");
  errorFeedback();
}

bool startProfessorSession(String rfidTag) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return false;
  }
  
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/rpc/start_professor_session");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("apikey", supabaseKey);
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["p_professor_rfid"] = rfidTag;
  doc["p_classroom_device_id"] = deviceId;
  doc["p_subject"] = "Class Session";
  doc["p_late_threshold"] = 15;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Starting professor session...");
  Serial.println("Payload: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response: " + response);
    
    // Parse response
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"] == true) {
      Serial.println("Professor: " + responseDoc["professor_name"].as<String>());
      Serial.println("Classroom: " + responseDoc["classroom_name"].as<String>());
      http.end();
      return true;
    }
  }
  
  http.end();
  return false;
}

bool recordStudentAttendance(String rfidTag) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return false;
  }
  
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
    Serial.println("Response: " + response);
    
    // Parse response
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"] == true) {
      Serial.println("Student: " + responseDoc["student_name"].as<String>());
      Serial.println("Status: " + responseDoc["status"].as<String>());
      Serial.println("Student Number: " + responseDoc["student_number"].as<String>());
      http.end();
      return true;
    } else {
      Serial.println("Error: " + responseDoc["error"].as<String>());
    }
  }
  
  http.end();
  return false;
}

void successFeedback() {
  // Green LED and short beep
  digitalWrite(LED_SUCCESS, HIGH);
  tone(BUZZER_PIN, 1000, 200);
  delay(500);
  digitalWrite(LED_SUCCESS, LOW);
}

void errorFeedback() {
  // Red LED and error beeps
  digitalWrite(LED_ERROR, HIGH);
  tone(BUZZER_PIN, 500, 100);
  delay(150);
  tone(BUZZER_PIN, 500, 100);
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
