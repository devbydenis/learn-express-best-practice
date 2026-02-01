import express from "express";

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  console.log(
    `Environment: ${process.env.NODE_ENV === "Development" ? "Development" : "Production"}`,
  );
});
