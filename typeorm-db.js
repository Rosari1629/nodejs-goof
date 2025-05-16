const typeorm = require("typeorm");
const EntitySchema = typeorm.EntitySchema;

const Users = require("./entity/Users");

// Setup koneksi MySQL
typeorm.createConnection({
  name: "mysql",
  type: "mysql",
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  username: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "root",
  database: process.env.MYSQL_DATABASE || "acme",
  synchronize: true,  // hanya untuk dev, disable di production!
  logging: false,
  entities: [new EntitySchema(Users)],
}).then(async (connection) => {
  const repo = connection.getRepository("Users");

  // Cek apakah user sudah ada
  const existingUsers = await repo.find();
  if (existingUsers.length === 0) {
    console.log("Seeding 2 users ke tabel MySQL: Liran (user), Simon (admin)");
    await repo.insert([
      { name: "Liran", address: "IL", role: "user" },
      { name: "Simon", address: "UK", role: "admin" },
    ]);
    console.log("Seeding selesai.");
  } else {
    console.log("Data user sudah ada. Skip seeding.");
  }
}).catch((err) => {
  console.error("❌ Gagal koneksi dan seeding ke database MySQL.");
  console.error(err.message || err);
});
