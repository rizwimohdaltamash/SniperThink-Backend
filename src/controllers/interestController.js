import { createUser, getUserByEmail } from "../models/userModel.js";

export const submitInterest = async (req, res) => {
  try {
    const { name, email, selectedStep } = req.body;

    if (!name || !email || !selectedStep) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, email, and selectedStep",
      });
    }

    // Save or update the user
    let user = await getUserByEmail(email);
    if (!user) {
      user = await createUser(name, email);
    }

    // Simulate a slight delay to allow the frontend to gracefully show its loading state
    await new Promise((resolve) => setTimeout(resolve, 800));

    res.status(200).json({
      success: true,
      message: "Interest successfully recorded",
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        selectedStep,
      },
    });
  } catch (error) {
    console.error("❌ Interest submission error:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error while processing interest",
    });
  }
};
