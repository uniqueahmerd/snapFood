import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useVerifyEmail } from "@/hooks/useAuth";
// import Button from "../component/Button";
// import { UseAuthStore } from "../store/AuthStore";
// import { toast } from "react-toastify";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const verifyEmail = useVerifyEmail(token);

  useEffect(() => {
    if (verifyEmail.isSuccess) {
      toast.success("Email verified successfully!");
      navigate("/login", { replace: true });
    }
  }, [navigate, verifyEmail.isSuccess]);

  if (!token) {
    return (
      <div className="max-h-screen flex justify-center items-center m-auto">
        <div className="p-8 max-w-md w-full backdrop-blur-3xl overflow-hidden rounded-3xl shadow-xl text-center">
          <h2 className="font-bold text-3xl mb-6 text-center text-collage-blue bg-clip-text">
            Invalid verification link
          </h2>
          <p className="text-middle-blue text-center mb-6">
            This verification link is missing a token.
          </p>
        </div>
      </div>
    );
  }

  const errorMessage = verifyEmail.error instanceof Error ? verifyEmail.error.message : "Failed to verify email.";

  return (
    <div className="max-h-screen flex justify-center items-center m-auto">
      <div className="p-8 max-w-md w-full backdrop-blur-3xl overflow-hidden rounded-3xl shadow-xl">
        <h2 className="font-bold text-3xl mb-6 text-center text-collage-blue bg-clip-text">
          Verify Your Email
        </h2>
        <p className="text-middle-blue text-center mb-6">
          Verifying your email address using the secure token from the link you received.
        </p>

        {verifyEmail.isPending && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin size-5 text-green-600" />
            <span className="ml-2 text-sm text-gray-600">Verifying email...</span>
          </div>
        )}

        {verifyEmail.isError && (
          <p className="text-red-500 text-sm text-center mb-4">{errorMessage}</p>
        )}

        {verifyEmail.isSuccess && (
          <p className="text-green-500 text-sm text-center mb-4">
            Email verified successfully!
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyOtp;
