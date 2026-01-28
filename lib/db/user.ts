import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    occupation?: {
        title: string;
        type: "student" | "professional" | "custom";
        confidence?: number;
        incomePattern?: string;
    };
    categories?: {
        name: string;
        type: string;
        icon?: string;
        budget?: number;
    }[];
    financialTips?: string[];
    createdAt: string;
}

export async function createUserProfile(uid: string, email: string) {
    const userRef = doc(db, "users", uid);
    // Merge to avoid overwriting if exists
    await setDoc(userRef, {
        uid,
        email,
        createdAt: new Date().toISOString(),
    }, { merge: true });
}

export async function updateUserOccupation(uid: string, occupationData: any) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        occupation: {
            title: occupationData.occupation,
            type: "custom", // or derived
            confidence: occupationData.confidence,
            incomePattern: occupationData.incomePattern,
        },
        categories: occupationData.categories,
        financialTips: occupationData.financialTips,
        onboardingCompleted: true,
    });
}

// Predefined defaults for standard roles
export const STANDARD_ROLES = {
    student: {
        occupation: "Student",
        categories: [
            { name: "Tuition", type: "essential", icon: "GraduationCap" },
            { name: "Textbooks", type: "essential", icon: "Book" },
            { name: "Food", type: "essential", icon: "Utensils" },
            { name: "Transport", type: "essential", icon: "Bus" },
            { name: "Entertainment", type: "discretionary", icon: "Gamepad2" },
        ],
        incomePattern: "Allowance/Part-time",
        financialTips: ["Use student discounts everywhere", "Buy used textbooks"]
    },
    professional: {
        occupation: "Corporate Professional",
        categories: [
            { name: "Rent/Mortgage", type: "essential", icon: "Home" },
            { name: "Groceries", type: "essential", icon: "ShoppingCart" },
            { name: "Commute", type: "essential", icon: "Car" },
            { name: "Savings", type: "savings", icon: "PiggyBank" },
            { name: "Dining Out", type: "discretionary", icon: "Utensils" },
            { name: "Utilities", type: "essential", icon: "Zap" },
        ],
        incomePattern: "Monthly Salary",
        financialTips: ["Max out 401k match", "Build 6-month emergency fund"]
    }
};
