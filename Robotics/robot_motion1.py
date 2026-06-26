#========================================================
            # NAME: Sachchidanand Yadav
            # B-tech CSE 3rd Year
# =======================================================
            # SIMPLE & OPTIMIZED ROBOT CONTROL
# =======================================================

# Purpose:
# Robot ko forward, backward, left, right move karna
# using simple reusable logic (easy for beginners)

# ---------- STEP 1: Import ----------
try:
    import RPi.GPIO as GPIO  #Yeh ek special library hai jo Raspberry Pi ke pins control karti hai
except:
    # Agar Raspberry Pi nahi hai to dummy GPIO (testing ke liye)
    class GPIO:
        BCM = OUT = None
        def setmode(x): pass
        def setwarnings(x): pass
        def setup(a,b): pass
        def output(a,b): print(f"Pin {a} -> {b}")
        def cleanup(): pass

import time


# ---------- STEP 2: Setup ----------
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

# Motor pins (Left + Right)
pins = {
    "L1": 17, "L2": 18,   # Left motor
    "R1": 22, "R2": 23    # Right motor
}

# Sab pins ko OUTPUT bana do
for p in pins.values():
    GPIO.setup(p, GPIO.OUT)


# ---------- STEP 3: Core Function ----------
def move(l1, l2, r1, r2, action):
    """
    Ye function pura robot control karta hai
    l1,l2 → left motor
    r1,r2 → right motor
    action → kya movement ho raha hai (print ke liye)
    """
    print(f"Robot is {action}")

    GPIO.output(pins["L1"], l1)
    GPIO.output(pins["L2"], l2)
    GPIO.output(pins["R1"], r1)
    GPIO.output(pins["R2"], r2)


# ---------- STEP 4: Movement Functions ----------

def forward():
    move(1, 0, 1, 0, "MOVING FORWARD")

def backward():
    move(0, 1, 0, 1, "MOVING BACKWARD")

def left():
    move(0, 1, 1, 0, "TURNING LEFT")

def right():
    move(1, 0, 0, 1, "TURNING RIGHT")

def stop():
    move(0, 0, 0, 0, "STOPPED")


# ---------- STEP 5: Main Loop ----------
try:
    n=4
    # while True:---------- (infinite loop ke liye)
    forward(); time.sleep(3)
    stop();    time.sleep(1)

    left();    time.sleep(2)
    stop();    time.sleep(1)

    right();   time.sleep(2)
    stop();    time.sleep(1)

    backward();time.sleep(3)
    stop();    time.sleep(2)

except KeyboardInterrupt:
    print("Program stopped")
    stop()
    GPIO.cleanup()