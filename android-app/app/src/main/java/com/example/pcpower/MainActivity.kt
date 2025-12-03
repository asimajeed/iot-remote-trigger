package com.example.pcpower

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    
    private lateinit var mqttManager: MqttManager
    private lateinit var statusText: TextView
    private lateinit var powerButton: Button
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        statusText = findViewById(R.id.statusText)
        powerButton = findViewById(R.id.powerButton)
        
        mqttManager = MqttManager(this)
        
        powerButton.setOnClickListener {
            if (mqttManager.isConnected()) {
                mqttManager.publishPowerCommand()
                statusText.text = "Command sent!"
            } else {
                statusText.text = "Connecting..."
                mqttManager.connect { connected ->
                    runOnUiThread {
                        if (connected) {
                            statusText.text = "Connected"
                            mqttManager.publishPowerCommand()
                        } else {
                            statusText.text = "Connection failed"
                        }
                    }
                }
            }
        }
        
        statusText.text = "Ready"
    }
    
    override fun onDestroy() {
        super.onDestroy()
        mqttManager.disconnect()
    }
}
