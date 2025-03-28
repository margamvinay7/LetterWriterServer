import firebaseAdmin from "../utils/firebaseAdmin.js";
import { google } from "googleapis";
import { parseHTMLToGoogleDocs } from "../utils/htmlToGoogleDocs.js"; // Import the HTML parser function

const oauth2Client = new google.auth.OAuth2();
const drive = google.drive({ version: "v3", auth: oauth2Client });
const docs = google.docs({ version: "v1", auth: oauth2Client });

export const saveDraft = async (req, res) => {
  try {
    const { title, content, userAccessToken } = req.body;

    if (!title || !content || !userAccessToken) {
      return res.status(400).json({
        error: "Title, content, and Google access token are required",
      });
    }

    // Verify Firebase ID token
    const decodedToken = req.decodedToken;
    await firebaseAdmin.auth().getUser(decodedToken.uid);

    // Validate Google Access Token
    const tokenInfo = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${userAccessToken}`
    );
    const tokenData = await tokenInfo.json();

    if (tokenData.error) {
      console.error("Token verification failed:", tokenData);
      return res.status(401).json({ error: "Invalid Google Access Token" });
    }

    console.log("Token is valid, proceeding...");

    // Setup Google OAuth client

    if (
      !oauth2Client.credentials ||
      oauth2Client.credentials.access_token !== userAccessToken
    ) {
      oauth2Client.setCredentials({ access_token: userAccessToken });
    }

    // Find or create "Letters" folder in Google Drive
    const folderName = "Drafts";
    let folderId;

    const folderQuery = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
    });

    if (folderQuery.data.files.length > 0) {
      folderId = folderQuery.data.files[0].id;
    } else {
      const folder = await drive.files.create({
        resource: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      folderId = folder.data.id;
    }

    // Create Google Docs file
    const fileMetadata = {
      name: title,
      mimeType: "application/vnd.google-apps.document",
      parents: [folderId],
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      fields: "id",
    });

    const documentId = file.data.id;

    // Convert HTML content to Google Docs API requests
    const requests = parseHTMLToGoogleDocs(content);

    // Apply formatting to Google Docs file
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });

    res.status(200).json({
      message: "File created successfully",
      fileId: documentId,
    });
  } catch (error) {
    console.error("Error creating Google Doc:", error);
    res.status(500).json({ error: "Failed to create document" });
  }
};

export const listDraftsInFolder = async (req, res) => {
  let folderName = "Drafts";
  try {
    const { userAccessToken } = req.body;

    if (!folderName || !userAccessToken) {
      return res
        .status(400)
        .json({ error: "Folder name and access token are required" });
    }

    // 🔹 Set OAuth credentials only if necessary
    if (
      !oauth2Client.credentials ||
      oauth2Client.credentials.access_token !== userAccessToken
    ) {
      oauth2Client.setCredentials({ access_token: userAccessToken });
    }

    // 🔹 Find the folder ID
    const folderResponse = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
    });

    if (folderResponse.data.files.length === 0) {
      return res
        .status(404)
        .json({ error: `Folder "${folderName}" not found.` });
    }

    const folderId = folderResponse.data.files[0].id;
    console.log(`📂 Found folder "${folderName}" with ID: ${folderId}`);

    // 🔹 List files inside the folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, mimeType, createdTime)",
    });

    if (!response.data.files.length) {
      return res
        .status(200)
        .json({ message: `No files found in "${folderName}".`, files: [] });
    }

    // 🔹 Prepare response data
    const files = response.data.files.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      createdTime: file.createdTime,
    }));

    res.status(200).json({
      message: `Files in "${folderName}" retrieved successfully.`,
      files,
    });
  } catch (error) {
    console.error("Error retrieving files:", error);
    res.status(500).json({ error: "Failed to retrieve files." });
  }
};

export const getDraftDetails = async (req, res) => {
  try {
    const { fileId, userAccessToken } = req.body;
    console.log("fileId", fileId);

    if (!fileId || !userAccessToken) {
      return res
        .status(400)
        .json({ error: "File ID and access token are required" });
    }

    // Set OAuth credentials
    if (
      !oauth2Client.credentials ||
      oauth2Client.credentials.access_token !== userAccessToken
    ) {
      oauth2Client.setCredentials({ access_token: userAccessToken });
    }

    // Get file metadata
    const fileMetadata = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, createdTime",
    });

    const mimeType = fileMetadata.data.mimeType;
    let fileContent = "";

    // 🔹 Handle Google Docs (export as HTML)
    if (mimeType === "application/vnd.google-apps.document") {
      const response = await drive.files.export(
        {
          fileId,
          mimeType: "text/html",
        },
        { responseType: "text" }
      );

      fileContent = response.data; // HTML content of the Google Doc
    } else {
      return res
        .status(400)
        .json({ error: "Only Google Docs files are supported." });
    }

    res.status(200).json({
      message: "File retrieved successfully",
      file: {
        id: fileMetadata.data.id,
        name: fileMetadata.data.name,
        mimeType: fileMetadata.data.mimeType,
        createdTime: fileMetadata.data.createdTime,
        content: fileContent, // HTML formatted content
      },
    });
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).json({ error: "Failed to retrieve file content." });
  }
};
