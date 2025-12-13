package com.example.pcpower

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var mqttManager: MqttManager
    private lateinit var statusText: TextView
    private lateinit var connectionStatusText: TextView
    private lateinit var powerButton: ImageButton
    private lateinit var statusIndicator: View

    private enum class ConnectionState {
        DISCONNECTED,
        CONNECTING,
        READY,
        ERROR
    }

    private var currentState = ConnectionState.DISCONNECTED

    @SuppressLint("ClickableViewAccessibility")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusText = findViewById(R.id.statusText)
        connectionStatusText = findViewById(R.id.connectionStatusText)
        powerButton = findViewById(R.id.powerButton)
        statusIndicator = findViewById(R.id.statusIndicator)

        // Disable sound effects on button to remove audio chime
        powerButton.isSoundEffectsEnabled = false

        mqttManager = MqttManager(this)

        var pressStartTime = 0L
        var isLongPress = false

        powerButton.setOnTouchListener { view, event ->
            when (event.action) {
                android.view.MotionEvent.ACTION_DOWN -> {
                    pressStartTime = System.currentTimeMillis()
                    isLongPress = false
                    true
                }
                android.view.MotionEvent.ACTION_UP -> {
                    view.performClick() // Add this line for accessibility
                    val pressDuration = (System.currentTimeMillis() - pressStartTime).toInt()

                    when (currentState) {
                        ConnectionState.READY -> {
                            if (pressDuration > 100) {
                                mqttManager.publishPowerCommand(pressDuration)
                                updateStatus(
                                    "Power button held for ${pressDuration}ms",
                                    ConnectionState.READY
                                )
                            } else {
                                mqttManager.publishPowerCommand(200)
                                updateStatus("Power button pressed!", ConnectionState.READY)
                            }
                        }
                        ConnectionState.DISCONNECTED, ConnectionState.ERROR -> {
                            updateStatus("Establishing connection...", ConnectionState.CONNECTING)
                            mqttManager.connect { connected ->
                                runOnUiThread {
                                    if (connected) {
                                        updateStatus(
                                            "Ready to control PC power",
                                            ConnectionState.READY
                                        )
                                        val duration =
                                            if (pressDuration > 100) pressDuration else 200
                                        mqttManager.publishPowerCommand(duration)
                                    } else {
                                        updateStatus(
                                            "Unable to reach AWS - Tap to retry",
                                            ConnectionState.ERROR
                                        )
                                    }
                                }
                            }
                        }
                        ConnectionState.CONNECTING -> {
                            // Do nothing while connecting
                        }
                    }
                    true
                }
                else -> false
            }
        }

        // Set initial state
        updateStatus("Tap to power on/off PC", ConnectionState.DISCONNECTED)
    }

    private fun updateStatus(message: String, state: ConnectionState) {
        currentState = state
        statusText.text = message

        when (state) {
            ConnectionState.DISCONNECTED -> {
                powerButton.setBackgroundResource(R.drawable.power_button_bg_disconnected)
                statusIndicator.setBackgroundResource(R.drawable.status_dot_disconnected)
                connectionStatusText.text = "Disconnected"
                connectionStatusText.setTextColor(
                        ContextCompat.getColor(this, android.R.color.darker_gray)
                )
            }
            ConnectionState.CONNECTING -> {
                powerButton.setBackgroundResource(R.drawable.power_button_bg_connecting)
                statusIndicator.setBackgroundResource(R.drawable.status_dot_connecting)
                connectionStatusText.text = "Connecting..."
                connectionStatusText.setTextColor(0xFFFFA726.toInt())
            }
            ConnectionState.READY -> {
                powerButton.setBackgroundResource(R.drawable.power_button_bg_ready)
                statusIndicator.setBackgroundResource(R.drawable.status_dot_ready)
                connectionStatusText.text = "Connected"
                connectionStatusText.setTextColor(0xFF4CAF50.toInt())
            }
            ConnectionState.ERROR -> {
                powerButton.setBackgroundResource(R.drawable.power_button_bg_error)
                statusIndicator.setBackgroundResource(R.drawable.status_dot_error)
                connectionStatusText.text = "Error"
                connectionStatusText.setTextColor(0xFFF44336.toInt())
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        mqttManager.disconnect()
    }
}
