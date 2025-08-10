import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, users, NewUser } from "../db";
import { traceDatabase } from "../middleware/xray";

const userRoutes = new Hono();

// GET /users
userRoutes.get("/", async (c) => {
  try {
    const allUsers = await traceDatabase("get-all-users", async () => {
      return await db.select().from(users);
    });
    return c.json({ users: allUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// GET /users/:id
userRoutes.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid user ID" }, 400);
    }

    const user = await traceDatabase("get-user-by-id", async () => {
      return await db.select().from(users).where(eq(users.id, id));
    });
    if (user.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user: user[0] });
  } catch (error) {
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// POST /users
userRoutes.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, age } = body;

    if (!name || !email) {
      return c.json({ error: "Name and email are required" }, 400);
    }

    const newUser: NewUser = {
      name,
      email,
      age: age || null,
    };

    const createdUser = await traceDatabase("create-user", async () => {
      return await db.insert(users).values(newUser).returning();
    });
    return c.json({ user: createdUser[0] }, 201);
  } catch (error: any) {
    if (error.code === "23505") {
      return c.json({ error: "Email already exists" }, 409);
    }
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// PUT /users/:id
userRoutes.put("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid user ID" }, 400);
    }

    const body = await c.req.json();
    const { name, email, age } = body;

    const updateData: Partial<NewUser> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (age !== undefined) updateData.age = age;
    updateData.updatedAt = new Date();

    const updatedUser = await traceDatabase("update-user", async () => {
      return await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();
    });

    if (updatedUser.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user: updatedUser[0] });
  } catch (error: any) {
    if (error.code === "23505") {
      return c.json({ error: "Email already exists" }, 409);
    }
    return c.json({ error: "Failed to update user" }, 500);
  }
});

// DELETE /users/:id
userRoutes.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid user ID" }, 400);
    }

    const deletedUser = await traceDatabase("delete-user", async () => {
      return await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
    });

    if (deletedUser.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      message: "User deleted successfully",
      user: deletedUser[0],
    });
  } catch (error) {
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

export default userRoutes;
