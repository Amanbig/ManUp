import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

const PORT = process.env.PORT || 8000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
});