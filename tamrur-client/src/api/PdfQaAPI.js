// External
import axios from "axios";

/**
 * Base URL for the standalone PDF Q&A service (pdf-parse/server.js), read
 * from the client's .env file. Temporary direct client -> service call for
 * an initial check; the plan is to proxy this through TamrurAPI/tamrur-server
 * once the integration is confirmed, so no auth token is attached here.
 * @type {string}
 */
const PDF_QA_URL = import.meta.env.VITE_PDF_QA_URL;

const PdfQaAPI = axios.create({
  baseURL: PDF_QA_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default PdfQaAPI;
