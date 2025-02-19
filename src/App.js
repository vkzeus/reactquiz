import React, { useEffect, useState, useCallback } from "react";
import quizData from "./quizData";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Box,
  CircularProgress,
} from "@mui/material";
import { useSnackbar } from "notistack"; // MUI Snackbar for notifications

// Debounce function
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

function App() {
  const { enqueueSnackbar } = useSnackbar(); // Initialize Snackbar
  const [data, setData] = useState(quizData);
  const [points, setPoints] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [attempts, setAttempts] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);

  useEffect(() => {
    if (quizCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 0) {
          handleNextQuestion();
          return 30; // Reset time for next question
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, quizCompleted]);

  // Handle multiple-choice answers
  const handleAnswer = (e, index) => {
    const selectedOption = e.target.value; // Get the full option text (e.g., "A. Mercury")
    const selectedAnswer = selectedOption.split(". ")[1]; // Extract the answer text (e.g., "Mercury")
    const isCorrect = selectedAnswer === data[index].correctAnswer;

    setAttempts((prev) => ({
      ...prev,
      [index]: (prev[index] || 0) + 1,
    }));

    if (isCorrect) {
      setPoints((prevPoints) => {
        enqueueSnackbar(`✅ Correct! Score: ${prevPoints + 1}`, { variant: "success" });
        return prevPoints + 1;
      });
    } else {
      enqueueSnackbar("❌ Wrong Answer! Try again.", { variant: "error" });
    }
  };

  // Debounced function for validating integer-type answers
  const validateIntegerAnswer = useCallback(
    debounce((index, value) => {
      if (value !== "" && Number(value) === Number(data[index].correctAnswer)) {
        setPoints((prevPoints) => {
          enqueueSnackbar(`✅ Correct! Score: ${prevPoints + 1}`, { variant: "success" });
          return prevPoints + 1;
        });
        setUserAnswers((prev) => ({ ...prev, [index]: "" })); // Clear input after correct answer
      } else if (value !== "") {
        enqueueSnackbar("❌ Wrong Answer! Try again.", { variant: "error" });
      }
    }, 2000),
    [data]
  );

  // Handle integer-type answers
  const handleIntegerAnswer = (e, index) => {
    const value = e.target.value.trim();
    setUserAnswers((prev) => ({ ...prev, [index]: value }));
    validateIntegerAnswer(index, value);
  };

  // Move to the next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < data.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(30); // Reset timer
    } else {
      setQuizCompleted(true);
      saveQuizHistory();
    }
  };

  // Save quiz history
  const saveQuizHistory = () => {
    const historyEntry = {
      date: new Date().toLocaleString(),
      score: points,
      totalQuestions: data.length,
    };
    setQuizHistory((prev) => [...prev, historyEntry]);
  };

  // Render a question card
  const renderQuestion = (question, index) => {
    return (
      <Card sx={{ maxWidth: 600, margin: "20px auto", padding: "20px", boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {question.question}
          </Typography>

          {question.options ? (
            <RadioGroup onChange={(e) => handleAnswer(e, index)}>
              {question.options.map((option, i) => (
                <FormControlLabel key={i} value={option} control={<Radio />} label={option} />
              ))}
            </RadioGroup>
          ) : (
            <TextField
              type="number"
              label="Enter your answer"
              variant="outlined"
              fullWidth
              value={userAnswers[index] || ""}
              onChange={(e) => handleIntegerAnswer(e, index)}
              sx={{ mt: 2 }}
            />
          )}

          {question.options ? (
            <Typography variant="body2" sx={{ mt: 1, color: "gray" }}>
              Attempts: {attempts[index] || 0}
            </Typography>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  // Render scoreboard
  const renderScoreboard = () => {
    return (
      <Card sx={{ maxWidth: 500, margin: "auto", padding: "20px", textAlign: "center", boxShadow: 4 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Quiz Completed!
          </Typography>
          <Typography variant="h5">
            Your Score: {points} / {data.length}
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Quiz History:
          </Typography>
          <ul>
            {quizHistory.map((entry, i) => (
              <li key={i}>
                {entry.date} - Score: {entry.score} / {entry.totalQuestions}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container sx={{ textAlign: "center", mt: 4 }}>
      <Typography variant="h3" gutterBottom>
        Quiz Questions
      </Typography>

      {!quizCompleted ? (
        <div>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mb: 3 }}>
            <Typography variant="h6">Time Left: {timeLeft} seconds</Typography>
            <CircularProgress variant="determinate" value={(timeLeft / 30) * 100} size={50} />
          </Box>

          {renderQuestion(data[currentQuestionIndex], currentQuestionIndex)}

          <Button
            variant="contained"
            color="primary"
            onClick={handleNextQuestion}
            sx={{ mt: 3, width: "200px" }}
          >
            {currentQuestionIndex < data.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
        </div>
      ) : (
        renderScoreboard()
      )}
    </Container>
  );
}

export default App;