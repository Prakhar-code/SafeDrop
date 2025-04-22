"use server"

import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"

interface RegisterUserParams {
  name: string
  email: string
  password: string
}

export async function registerUser(params: RegisterUserParams) {
  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: {
        email: params.email,
      },
    })

    if (existingUser) {
      return {
        success: false,
        error: "A user with this email already exists",
      }
    }

    // Hash the password
    const hashedPassword = await hashPassword(params.password)

    // Create the user
    await db.user.create({
      data: {
        name: params.name,
        email: params.email,
        password: hashedPassword,
      },
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error registering user:", error)
    return {
      success: false,
      error: "Failed to register user",
    }
  }
}
