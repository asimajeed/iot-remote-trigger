package com.example.pcpower

import android.content.Context
import android.util.Log
import org.eclipse.paho.android.service.MqttAndroidClient
import org.eclipse.paho.client.mqttv3.*

class MqttManager(private val context: Context) {

    private val TAG = "MqttManager"
    private var mqttClient: MqttAndroidClient? = null
    private var connectionCallback: ((Boolean) -> Unit)? = null
    private var isConnecting = false

    fun connect(onConnectionChange: (Boolean) -> Unit) {
        connectionCallback = onConnectionChange

        // Check if already connected
        if (mqttClient?.isConnected == true) {
            Log.i(TAG, "Already connected to AWS IoT")
            connectionCallback?.invoke(true)
            return
        }

        // Prevent multiple simultaneous connection attempts
        if (isConnecting) {
            Log.i(TAG, "Connection already in progress")
            return
        }

        isConnecting = true

        // Completely dispose of the old client if it exists
        mqttClient?.let { client ->
            try {
                if (client.isConnected) {
                    // Use disconnectForcibly to immediately release resources
                    client.disconnectForcibly(0, 0)
                } else {
                    // Still need to clean up even if not connected
                    try {
                        client.unregisterResources()
                    } catch (e: Exception) {
                        // Ignore if already unregistered
                    }
                }
                client.close()
            } catch (e: Exception) {
                Log.w(TAG, "Error cleaning up old client", e)
            }
        }

        // Nullify the reference
        mqttClient = null

        // Give the old client time to fully clean up async resources
        android.os.Handler(android.os.Looper.getMainLooper())
                .postDelayed({ createAndConnect() }, 200) // 200ms delay for cleanup
    }

    private fun createAndConnect() {
        // Create a fresh client instance with a unique client ID
        val serverUri = "wss://${AwsIotConfig.ENDPOINT}:443/mqtt"
        val uniqueClientId = "${AwsIotConfig.CLIENT_ID}_${System.currentTimeMillis()}"

        try {
            mqttClient = MqttAndroidClient(context, serverUri, uniqueClientId)

            mqttClient?.setCallback(
                    object : MqttCallback {
                        override fun connectionLost(cause: Throwable?) {
                            Log.w(TAG, "Connection lost", cause)
                            isConnecting = false
                            connectionCallback?.invoke(false)
                        }

                        override fun messageArrived(topic: String?, message: MqttMessage?) {
                            Log.d(TAG, "Message: $topic - ${message?.toString()}")
                        }

                        override fun deliveryComplete(token: IMqttDeliveryToken?) {
                            Log.d(TAG, "Delivery complete")
                        }
                    }
            )

            val options =
                    MqttConnectOptions().apply {
                        isCleanSession = true
                        connectionTimeout = 30
                        keepAliveInterval = 60
                        userName = AwsIotConfig.ACCESS_KEY
                        password = AwsIotConfig.SECRET_KEY.toCharArray()
                    }

            mqttClient?.connect(
                    options,
                    null,
                    object : IMqttActionListener {
                        override fun onSuccess(asyncActionToken: IMqttToken?) {
                            Log.i(TAG, "Connected to AWS IoT")
                            isConnecting = false
                            connectionCallback?.invoke(true)
                        }

                        override fun onFailure(
                                asyncActionToken: IMqttToken?,
                                exception: Throwable?
                        ) {
                            Log.e(TAG, "Connection failed", exception)
                            isConnecting = false
                            connectionCallback?.invoke(false)
                        }
                    }
            )
        } catch (e: Exception) {
            Log.e(TAG, "Connect error", e)
            isConnecting = false
            connectionCallback?.invoke(false)
        }
    }

    fun publishPowerCommand(duration: Int = 200) {
        val payload = """{"cmd":"power","duration":$duration}"""

        try {
            mqttClient?.publish(AwsIotConfig.CMD_TOPIC, payload.toByteArray(), 1, false)
            Log.i(TAG, "Published: $payload")
        } catch (e: Exception) {
            Log.e(TAG, "Publish error", e)
        }
    }

    fun disconnect() {
        try {
            mqttClient?.let { client ->
                if (client.isConnected) {
                    // Use disconnectForcibly to immediately close all connections
                    client.disconnectForcibly(0, 0)
                } else {
                    try {
                        client.unregisterResources()
                    } catch (e: Exception) {
                        // Ignore
                    }
                }
                client.close()
            }
            mqttClient = null
            isConnecting = false
        } catch (e: Exception) {
            Log.e(TAG, "Disconnect error", e)
        }
    }

    fun isConnected(): Boolean = mqttClient?.isConnected ?: false
}
