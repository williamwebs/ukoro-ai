"use client";

import { userAtom } from "../../atom/userAtom";
import { SigninSignupForm } from "../../components/signin-signup-form";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";

type VerificationStatus = "idle" | "verifying" | "success" | "failure";

interface Result {
  title: string;
  shortDescription: string;
  summary: string;
  transcription: string;
}

interface Query {
  question: string;
  answer: string;
}

const VideoTranscriber = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("idle");
  const [verificationResult, setVerificationResult] = useState<Result | null>(
    null
  );
  const [question, setQuestion] = useState<string>("");
  const [queryResult, setQueryResult] = useState<Query[] | null>([]);

  const geminiApiKey = process.env.GEMINI_API_KEY as string;
  const genAI = new GoogleGenerativeAI(geminiApiKey);

  // handle video upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        setVideoPreview(e.target?.result as string);
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

    try {
      setVerificationStatus("verifying");
      setIsSummarizing(true);

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
      });
      const base64Data = await readFileAsBase64(file);

      const videoParts = [
        {
          inlineData: {
            data: base64Data.split(",")[1],
            mimeType: file.type,
          },
        },
      ];

      const prompt = `You are an expert video transcriber and content creator specializing in YouTube content. Analyze and transcribe the audio content of this video. Based on the transcription, please provide the following:
        1. Title: Generate a catchy, engaging title suitable for YouTube, using keywords relevant to the video's main topic.
        2. Short Description: Write a 1-2 sentence description summarizing the content to capture viewers' interest.
        3. Summary: Provide a 3-4 sentence summary covering the key points of the video content.
        4. Full Transcription: Transcribe the entire video, including any speaker changes or significant pauses.
        Return the output in JSON format without formatting characters (such as triple backticks ) or other markdown-like symbols that are causing issues with JSON parsing. Also, do not include any sentence before and sfter the JSON:
        {
            "title": "Generated video title here",
            "shortDescription": "Short description here",
            "summary": "Detailed summary here",
            "transcription": "Full transcription text here"
        }
        `;

      const result = await model.generateContent([prompt, ...videoParts]);
      const response = await result.response;
      const text = response.text();

      try {
        const cleanedResult = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        // console.log(cleanedResult);

        const parsedResult = JSON.parse(cleanedResult);
        // console.log(parsedResult);

        if (
          parsedResult.title &&
          parsedResult.shortDescription &&
          parsedResult.summary &&
          parsedResult.transcription
        ) {
          setVerificationResult(parsedResult);
          setVerificationStatus("success");

          setIsSummarizing(false);
        } else {
          console.error("Invalid transcription result", parsedResult);
          setVerificationStatus("failure");
          setIsSummarizing(false);
        }
      } catch (error) {
        console.error("Failed to parse as JSON", error);
        setVerificationStatus("failure");
        setIsSummarizing(false);
      }
    } catch (error) {
      console.error("Error transcribing video", error);
      setVerificationStatus("failure");
      setIsSummarizing(false);
    }
  };

  const handleVideoQuery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question || question === null) return;

    if (verificationResult && question !== null) {
      const prompt = `You are a chat assistant. Based on the video content titled ${verificationResult?.title} and its transcription ${verificationResult?.transcription}, answer the following question accurately. Refer only to the video’s transcription as your information source.
    Video Summary: ${verificationResult?.summary} User Question: ${question}
    Respond directly as string to the question based on the transcription details.
    `;

      try {
        setIsUploading(true);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const newQueryResult = {
          question: question,
          answer: text,
        };

        setQueryResult((prev) =>
          prev ? [...prev, newQueryResult] : [newQueryResult]
        );
        setIsUploading(false);
        setQuestion("");
      } catch (error) {
        setIsUploading(false);
        console.error("Error sending query", error);
      }
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [queryResult]);

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
          {videoPreview && (
            <div className="rounded-lg my-2 overflow-hidden shadow w-full h-full">
              <video
                src={videoPreview}
                className="rounded-lg w-full h-full object-contain"
                controls
              />
            </div>
          )}
        </div>
        <form onSubmit={handleFormSubmit}>
          <Label htmlFor="picture" className="mt-4 mb-2 block">
            Upload your video (max 20MB)
          </Label>
          <Input
            id="picture"
            type="file"
            className="cursor-pointer"
            onChange={handleFileUpload}
          />
          <Button
            variant="default"
            disabled={!file || verificationStatus === "verifying"}
            className="w-full mt-3"
          >
            {isSummarizing ? "Analyzing..." : "Analyze"}
          </Button>
        </form>
      </div>
      <div className="w-full md:w-2/3 rounded-lg md:my-2 overflow-hidden shadow h-full max-h-[90vh] relative p-5">
        <div className="flex flex-col justify-between gap-4">
          <div className="h-[430px] overflow-y-scroll">
            {verificationResult && (
              <div ref={scrollRef}>
                <h3 className="font-semibold text-center capitalize text-lg mb-4">
                  This is a summary of the video with a great title and short
                  description:
                </h3>

                <div className="flex flex-col gap-4">
                  <div>
                    <h4 className="font-semibold text-base">
                      Suggested Title:
                    </h4>
                    <p className="md:text-base text-sm font-normal">
                      {verificationResult.title}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">
                      Short Description:
                    </h4>
                    <p className="md:text-base text-sm font-normal">
                      {verificationResult.shortDescription}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">Summary:</h4>
                    <p className="md:text-base text-sm font-normal">
                      {verificationResult.summary}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">Transcription:</h4>
                    <p className="md:text-base text-sm font-normal">
                      {verificationResult.transcription}
                    </p>
                  </div>
                </div>

                {/* answers */}
                {queryResult && (
                  <div>
                    {queryResult.map((q, index) => (
                      <div
                        key={index}
                        className="border-b w-full px-4 py-2 rounded"
                      >
                        <div className="mt-1 text-sm">
                          <span className="font-semibold text-base">Q:</span>{" "}
                          {q.question}
                        </div>
                        <div className="mt-1 text-sm">
                          <span className="font-semibold text-base">A:</span>{" "}
                          {q.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* chat input field */}
          <div className="w-[95%] mx-auto absolute bottom-2">
            <form className="grid w-full gap-2" onSubmit={handleVideoQuery}>
              <textarea
                placeholder="Type your question here."
                className="p-2 resize-none"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <Button
                disabled={verificationResult === null && question === null}
              >
                {isUploading ? "Asking..." : "Ask"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoTranscriber;
