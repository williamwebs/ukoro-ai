"use client";

import { userAtom } from "../../atom/userAtom";
import { SigninSignupForm } from "../../components/signin-signup-form";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useAtom } from "jotai";
import { useState } from "react";

type VerificationStatus = "idle" | "verifying" | "success" | "failure";

interface DoctorNoteAnalysis {
  extractedText: string;
  summary: {
    diagnosis: string;
    medication: { name: string; dosage: string; instructions: string }[];
    patientInstructions: string;
    additionalNotes: string;
  };
  explanation: string;
}

const ReportAnalyzer = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("idle");
  const [verificationResult, setVerificationResult] =
    useState<DoctorNoteAnalysis | null>(null);

  const geminiApiKey = process.env.GEMINI_API_KEY as string;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setVerificationResult(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const readFileAsBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setVerificationStatus("verifying");

    try {
      setIsSubmitting(true);

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const base64Data = await readFileAsBase64(file);

      const imageParts = [
        {
          inlineData: {
            data: base64Data.split(",")[1],
            mimeType: file.type,
          },
        },
      ];

      const prompt = `You are a medical transcription expert. Analyze the following image of a handwritten doctor’s note.
      1. Extract Text: Recognize and transcribe all handwritten content, including medical terms, abbreviations, and symbols.
      2. Contextual Understanding: Interpret any relevant medical context (e.g., diagnosis, patient instructions, medications, and dosages).
      3. Summarize Information: Summarize the key information found, categorizing it by sections such as diagnosis, medication instructions, and additional notes.
      Respond in JSON format like this without including any markdown:
      {
        "extractedText": "Full transcribed note here",
        "summary": {
          "diagnosis": "",
          "medications": [{"name": "", "dosage": "", "instructions": ""}],
          "patientInstructions": "",
          "additionalNotes": ""
        },
        "explanation": "Full explanation here and impact on the patients health"
      }
      `;

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;

      const text = response.text();

      try {
        const parsedResult = JSON.parse(text);

        if (parsedResult.extractedText && parsedResult.summary) {
          setVerificationResult(parsedResult);
          setVerificationStatus("success");
          setIsSubmitting(false);
        } else {
          console.error("Invalid verification result", parsedResult);
          setVerificationStatus("failure");
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error("Failed to parse as JSON", error);
        setVerificationStatus("failure");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error verifying food", error);
      setVerificationStatus("failure");
      setIsSubmitting(false);
    }
  };

  const [user] = useAtom(userAtom);

  if (!user || user === null) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <SigninSignupForm />
      </div>
    );
  }
  return (
    <div className="w-full h-full flex flex-col md:flex-row items-start gap-5 px-2">
      <div className="w-full md:h-full h-fit md:w-1/3 rounded">
        <div className="rounded-lg my-2 overflow-hidden shadow w-full h-[350px] md:h-[400px]">
          {preview && (
            <img
              src={preview}
              alt="x-ray preview"
              className="rounded-lg w-full h-full object-contain"
            />
          )}
        </div>
        <form onSubmit={handleFormSubmit}>
          <Label htmlFor="picture" className="mt-4 mb-2 block">
            Upload an image of the Doctor’s report
          </Label>
          <Input
            id="picture"
            type="file"
            className="cursor-pointer"
            onChange={handleFileChange}
          />
          <Button
            variant="default"
            disabled={!file || verificationStatus === "verifying"}
            className="w-full mt-3"
          >
            {isSubmitting ? "Analyzing..." : "Analyze"}
          </Button>
        </form>
      </div>
      <div className="w-full md:w-2/3 rounded-lg md:my-2 overflow-hidden shadow h-fit p-5">
        {verificationResult && (
          <div>
            <h3 className="font-semibold text-center capitalize text-lg md:text-xl underline mb-4">
              This is a breakdown of your Doctor’s report:
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <h4 className="font-semibold text-base md:text-lg">
                  Extracted text:
                </h4>
                <p className="md:text-base text-sm font-normal">
                  {verificationResult.extractedText}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-base md:text-lg">
                  Explanation:
                </h4>
                <p className="md:text-base text-sm font-normal">
                  {verificationResult.explanation}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-base md:text-lg">
                  Diagnosis:
                </h4>
                <p className="md:text-base text-sm font-normal">
                  {verificationResult.summary?.diagnosis}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-base md:text-lg">
                  Additional note:
                </h4>
                <p className="md:text-base text-sm font-normal">
                  {verificationResult.summary?.additionalNotes}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportAnalyzer;
