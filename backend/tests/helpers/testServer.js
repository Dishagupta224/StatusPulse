async function startTestServer(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address();

      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });

    server.on("error", reject);
  });
}

async function stopTestServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

module.exports = {
  startTestServer,
  stopTestServer,
};
