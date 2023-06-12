const arduinoProgramFileAdditionToTop = `

#include <Adafruit_NeoPixel.h>

#define PIN 6

#define DELAY 1

#define NUM_DRIVERS 12
#define ROWS 1
#define COLUMNS NUM_MOTORS / ROWS

// Parameter 1 = number of 2811s in strip
// Parameter 2 = arduino pin number (most are valid)
// Parameter 3 = pixel type flags, add together as needed:
//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)
//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)
//   NEO_GRB     Pixels are wired for GRB bitstream (most NeoPixel products)
//   NEO_RGB     Pixels are wired for RGB bitstream (v1 FLORA pixels, not v2)
Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_DRIVERS, PIN, NEO_GRB + NEO_KHZ400);

const int encPinA = 2;          // input pins
const int encPinB = 3;         //
const int encSwitchPin = 19;    //

const int encRedLED = 45;       // output pins
const int encGreenLED = 46;     //
const int encBlueLED = 44;      //

uint8_t encValueA = 0;                 //
uint8_t encValueB = 0;                 //
uint8_t encValueSwitch = 0;                 //
bool isrDidCall = false;
uint8_t myCurrentValue = 0;

uint8_t nextModeWait = 0; // 0 none on -> 1 on bottom -> 2 on bottom/top -> 3 on top -> 4 off all

uint32_t White = strip.Color(255, 255, 255);
uint32_t Black = strip.Color(  0,   0,   0);
uint32_t Red = strip.Color(255, 0, 0);
uint32_t Green = strip.Color(  0,   255,   0);
uint32_t Blue = strip.Color(  0,   0,   255);


uint8_t shortWait = 10;
uint8_t longWait = 100;
uint8_t midWait = 10;
uint8_t pauseWait = 75;

uint8_t micval = 0;

uint8_t mode = 0;
uint8_t pushDistance = 255;
uint32_t pushTime = 10;
uint32_t pushTimeUp = 10;

bool isPressed = false;

void increment() {
  switch (mode) {
    case 0:
      if (pushDistance < 255)
        pushDistance++;
      break;
    case 1:
      if (pushTime < 1000)
        pushTime ++;
      break;
    case 2:
      if (pushTimeUp < 1000)
        pushTimeUp ++;
      break;
  }
}

void decrement() {

  switch (mode) {
    case 0:
      if (pushDistance > 0)
        pushDistance--;
      break;
    case 1:
      if (pushTime > 0)
        pushTime --;
      break;
    case 2:
      if (pushTimeUp > 0)
        pushTimeUp --;
      break;
  }
}

void showValue() {
  if (isPressed) {
    switch (mode) {
      case 2: // 0
        analogWrite(encRedLED, 255);
        analogWrite(encGreenLED, 0);
        break;
      case 0: // 1
        analogWrite(encRedLED, 0);
        analogWrite(encGreenLED, 255);
        break;
      case 1: // 2
        analogWrite(encRedLED, 255);
        analogWrite(encGreenLED, 255);
        break;
    }
  } else {
    switch (mode) {
      case 0:
        analogWrite(encRedLED, pushDistance);
        analogWrite(encGreenLED, 0);
        break;
      case 1:
        analogWrite(encRedLED, 0);
        analogWrite(encGreenLED, pushTime);
        break;
      case 2:
        analogWrite(encRedLED, pushTimeUp);
        analogWrite(encGreenLED, pushTimeUp);
        break;
    }
  }
}

void interruptISR() {
  // the isr should work (1) and should set the next delay value so the next tap will be on the correct delay

  encValueA = digitalRead(encPinA);    // read encoder pins
  encValueB = digitalRead(encPinB);    //
  encValueSwitch = digitalRead(encSwitchPin);    //

  analogWrite(encGreenLED, myCurrentValue);
  //analogWrite(encBlueLED, 255 - myCurrentValue);


  switch (nextModeWait) {
    case 0:
      // wait for 10   cval
      if (encValueA == HIGH && encValueB == LOW) {
        nextModeWait = 1;
        increment();
      }
      if (encValueA == LOW && encValueB == HIGH) {
        nextModeWait = 3;
        decrement();
      }
      break;
    case 1:
      // wait for 11   a
      if (encValueA == HIGH && encValueB == HIGH) {
        nextModeWait = 2;
        increment();
      }
      if (encValueA == LOW && encValueB == LOW) {
        nextModeWait = 0;
        decrement();
      }
      break;
    case 2:
      // wait for 01   a
      if (encValueA == LOW && encValueB == HIGH) {
        nextModeWait = 3;
        increment();
      }
      if (encValueA == HIGH && encValueB == LOW) {
        nextModeWait = 1;
        decrement();
      }
      break;
    case 3:
      // wait for 00   ba
      if (encValueA == LOW && encValueB == LOW) {
        nextModeWait = 0;
        increment();
      }
      if (encValueA == HIGH && encValueB == HIGH) {
        nextModeWait = 2;
        decrement();
      }
      break;
  }
  showValue();
}

bool wasLastSwitched = false;

void interruptSwitch() {
  if (digitalRead(encSwitchPin) == 1) {
    isPressed = false;
    if (wasLastSwitched) {
      wasLastSwitched = false;
      mode ++;
      if (mode >= 3) mode = 0;
      showValue();
    }
  } else {
    isPressed = true;
    wasLastSwitched = true;
    showValue();
  }
}

void setup() {

  Serial.begin(57600);
  Serial.println("Rotary encoder standing by...");

  strip.begin();
  strip.show(); // Initialize all pixels to 'off'

  pinMode(encPinA, INPUT_PULLUP);    // active LOW logic
  pinMode(encPinB, INPUT_PULLUP);    // active LOW logic
  pinMode(encSwitchPin, INPUT);      // active HIGH logic (not pullup)

  digitalWrite(encSwitchPin, HIGH); //turn pullup resistor on

  attachInterrupt(digitalPinToInterrupt(encPinA), interruptISR, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encPinB), interruptISR, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encSwitchPin), interruptSwitch, CHANGE);

  showValue();
}


  
  
  

void loop() {
  testPatternSquare();
}

`;