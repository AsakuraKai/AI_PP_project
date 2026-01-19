package com.example.proguardtest

import retrofit2.Call
import retrofit2.http.GET
import kotlinx.serialization.Serializable

interface ApiService {
    @GET("users")
    fun getUsers(): Call<List<User>>
}

@Serializable
data class User(
    val id: Int,
    val name: String,
    val email: String
)