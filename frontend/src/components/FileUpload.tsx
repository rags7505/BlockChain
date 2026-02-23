import { useRef } from "react";
import { Box, Button, Typography, Alert } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  evidenceType?: "image" | "pdf" | "text";
  selectedFile?: File | null;
  error?: string | null;
  disabled?: boolean;
}

// Get accept string and validation for each evidence type
const getFileValidation = (evidenceType: string) => {
  switch (evidenceType) {
    case "image":
      return {
        accept: "image/*,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.tiff",
        validate: (file: File) => {
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            alert('Image file is too large (max 10MB)');
            return false;
          }
          return file.type.startsWith("image/");
        },
        errorMessage: "Only image files are allowed (max 10MB)",
      };
    case "pdf":
      return {
        accept: ".pdf,application/pdf",
        validate: (file: File) => file.type === "application/pdf" || file.name.endsWith(".pdf"),
        errorMessage: "Only PDF files are allowed",
      };
    case "text":
      return {
        accept: ".txt,text/plain",
        validate: (file: File) => {
          const maxSize = 10 * 1024 * 1024; // 10MB for text files
          if (file.size > maxSize) {
            alert('Text file is too large (max 10MB)');
            return false;
          }
          return file.type === "text/plain" || file.name.endsWith(".txt");
        },
        errorMessage: "Only text files (.txt) are allowed (max 10MB)",
      };
    default:
      return {
        accept: "image/*,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp",
        validate: (file: File) => {
          const isTooLarge = file.size > 10 * 1024 * 1024; // 10MB
          if (isTooLarge) {
            alert('Image file is too large (max 10MB)');
            return false;
          }
          return file.type.startsWith("image/");
        },
        errorMessage: "Only image files are allowed (max 10MB)",
      };
  }
};

export default function FileUpload({
  onFileSelect,
  evidenceType = "image",
  selectedFile,
  error,
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const validation = getFileValidation(evidenceType);

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!validation.validate(file)) {
        alert(validation.errorMessage);
        e.target.value = ""; // Reset input
        return;
      }
      
      onFileSelect(file);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          border: "2px dashed #aaa",
          padding: 4,
          textAlign: "center",
          borderRadius: 2,
          backgroundColor: selectedFile ? "#f0f8ff" : "transparent",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept={validation.accept}
          onChange={handleChange}
          disabled={disabled}
        />

        <CloudUploadIcon sx={{ fontSize: 40, color: "gray" }} />
        
        {selectedFile ? (
          <>
            <Typography variant="body1" sx={{ mt: 1, fontWeight: "bold", color: "green" }}>
              ✓ {selectedFile.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </Typography>
          </>
        ) : (
          <Typography variant="body1" sx={{ mt: 1 }}>
            Click to select evidence file
          </Typography>
        )}

        <Button 
          variant="contained" 
          sx={{ mt: 2 }} 
          onClick={handleClick}
          disabled={disabled}
        >
          {selectedFile ? "Change File" : "Choose File"}
        </Button>

        <Typography variant="caption" display="block" sx={{ mt: 2, color: "text.secondary" }}>
          Allowed: {evidenceType === "pdf" ? "PDF files only" : evidenceType === "text" ? "Text files (.txt)" : "Image files"}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
// import { useState } from "react"
// import { evidenceApi } from "../api/evidenceApi"

// export default function FileUpload({ onSuccess }) {
//   const [file, setFile] = useState(null)
//   const [caseId, setCaseId] = useState("")

//   const handleSubmit = async () => {
//     if (!file || !caseId) return alert("Missing fields")

//     const form = new FormData()
//     form.append("file", file)
//     form.append("caseId", caseId)

//     await evidenceApi.upload(form)
//     onSuccess()
//     setFile(null)
//     setCaseId("")
//   }

//   return (
//     <div className="card">
//       <h3>Upload Evidence</h3>
//       <input
//         placeholder="Case ID"
//         value={caseId}
//         onChange={e => setCaseId(e.target.value)}
//       />
//       <input
//         type="file"
//         accept=".pdf,image/*"
//         onChange={e => setFile(e.target.files[0])}
//       />
//       <button onClick={handleSubmit}>Upload</button>
//     </div>
//   )
// }
