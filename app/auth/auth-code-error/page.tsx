"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthCodeError() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-6">
              Sorry, we couldn't complete your authentication. This could be due
              to an expired or invalid link.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/auth/signin")}
                className="w-full bg-[#92278F] hover:bg-[#7a1f78] text-white"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full border-[#92278F] text-[#92278F] hover:bg-[#92278F] hover:text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
