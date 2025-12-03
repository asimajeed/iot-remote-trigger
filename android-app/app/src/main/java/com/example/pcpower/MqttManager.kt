package com.example.pcpower

import android.content.Context
import android.util.Log
import org.eclipse.paho.android.service.MqttAndroidClient
import org.eclipse.paho.client.mqttv3.*
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSocketFactory

class MqttManager(private val context: Context) {
    
    private val TAG = "MqttManager"
    private var mqttClient: MqttAndroidClient? = null
    private var connectionCallback: ((Boolean) -> Unit)? = null
    
    fun connect(onConnectionChange: (Boolean) -> Unit) {
        connectionCallback = onConnectionChange
        
        val serverUri = "wss://${AwsIotConfig.ENDPOINT}:443/mqtt"
        mqttClient = MqttAndroidClient(context, serverUri, AwsIotConfig.CLIENT_ID)
        
        mqttClient?.setCallback(object : MqttCallback {
            override fun connectionLost(cause: Throwable?) {
                Log.w(TAG, "Connection lost", cause)
                connectionCallback?.invoke(false)
            }
            
            override fun messageArrived(topic: String?, message: MqttMessage?) {
                Log.d(TAG, "Message: $topic - ${message?.toString()}")
            }
            
            override fun deliveryComplete(token: IMqttDeliveryToken?) {
                Log.d(TAG, "Delivery complete")
            }
        })
        
        val options = MqttConnectOptions().apply {
            isCleanSession = true
            connectionTimeout = 30
            keepAliveInterval = 60
            userName = AwsIotConfig.ACCESS_KEY
            password = AwsIotConfig.SECRET_KEY.toCharArray()
        }
        
        try {
            mqttClient?.connect(options, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.i(TAG, "Connected to AWS IoT")
                    connectionCallback?.invoke(true)
                }
                
                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.e(TAG, "Connection failed", exception)
                    connectionCallback?.invoke(false)
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "Connect error", e)
            connectionCallback?.invoke(false)
        }
    }
    
    fun publishPowerCommand(duration: Int = 200) {
        val payload = """{"cmd":"power","duration":$duration}"""
        
        try {
            mqttClient?.publish(
                AwsIotConfig.CMD_TOPIC,
                payload.toByteArray(),
                1,
                false
            )
            Log.i(TAG, "Published: $payload")
        } catch (e: Exception) {
            Log.e(TAG, "Publish error", e)
        }
    }
    
    fun disconnect() {
        try {
            mqttClient?.disconnect()
        } catch (e: Exception) {
            Log.e(TAG, "Disconnect error", e)
        }
    }
    
    fun isConnected(): Boolean = mqttClient?.isConnected ?: false
}
