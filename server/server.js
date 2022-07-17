const mongoose = require("mongoose");
const Document = require("./Document");

mongoose
  .connect("mongodb://localhost/google-docs-clone", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  });

const io = require("socket.io")(3001, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const defaultValue = "";

io.on("connection", (socket) => {
  console.log("\nUser connected");
  socket.on("get-document", async (documentId) => {
    console.log("document getting request...");
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);
    console.log("loading document to client...");

    socket.on("send-changes", (delta) => {
      console.log("sending change request...");
      socket.broadcast.to(documentId).emit("receive-changes", delta);
      console.log("broadcasting changes to client...");
    });

    socket.on("save-document", async (data) => {
      console.log("save");
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateDocument(id) {
  console.log("creating or finding document...");
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}
