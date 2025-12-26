const { getPool, sql } = require("../config/db.config.js");

// Save (Create/Update) Form
async function createForm(req, res) {
  const { formId, title, schema, isActive } = req.body;

  if (!title || !schema) {
    return res.status(400).json({ message: "Title and Schema are required." });
  }

  try {
    const pool = await getPool();
    
    // JSON Schema must be stringified if it's an object coming in
    const schemaStr = typeof schema === 'object' ? JSON.stringify(schema) : schema;

    const request = pool.request()
        .input("FormId", sql.Int, formId || null)
        .input("Title", sql.NVarChar(200), title)
        .input("SchemaJson", sql.NVarChar(sql.MAX), schemaStr)
        .input("IsActive", sql.Bit, isActive !== undefined ? isActive : 1);

    const result = await request.execute("sp_SaveForm");
    
    res.json({ 
        success: true, 
        message: "Form saved successfully", 
        formId: result.recordset[0].FormId 
    });

  } catch (err) {
    console.error("Save Form Error:", err);
    res.status(500).json({ message: "Failed to save form" });
  }
}

// Get All Forms
async function getForms(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request()
        .input("OnlyActive", sql.Bit, 0) // Get all for admin
        .execute("sp_GetForms");

    res.json({ success: true, forms: result.recordset });
  } catch (err) {
    console.error("Get Forms Error:", err);
    res.status(500).json({ message: "Failed to fetch forms" });
  }
}

// Get Form By ID (for rendering)
async function getFormById(req, res) {
    const { id } = req.params;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("FormId", sql.Int, id)
            .execute("sp_GetFormById");
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Form not found" });
        }

        const form = result.recordset[0];
        // Parse JSON for the frontend
        try {
            form.Schema = JSON.parse(form.SchemaJson);
        } catch (e) {
            form.Schema = [];
        }

        res.json({ success: true, form });
    } catch (err) {
        console.error("Get Form Error:", err);
        res.status(500).json({ message: "Failed to fetch form" });
    }
}

// Get Default Form
async function getDefaultForm(req, res) {
    try {
        const pool = await getPool();
        const result = await pool.request().execute("sp_GetDefaultForm");
        
        if (result.recordset.length > 0) {
            const form = result.recordset[0];
            try { form.Schema = JSON.parse(form.SchemaJson); } catch (e) { form.Schema = []; }
            res.json({ success: true, form });
        } else {
            res.json({ success: true, form: null });
        }
    } catch (err) {
        console.error("Get Default Form Error:", err);
        res.status(500).json({ message: "Failed to fetch default form" });
    }
}

// Update createForm to handle default
const originalCreateForm = createForm;
createForm = async function(req, res) {
  const { formId, title, schema, isActive, isDefault } = req.body;
  if (!title || !schema) return res.status(400).json({ message: "Title and Schema are required." });

  try {
    const pool = await getPool();
    const schemaStr = typeof schema === 'object' ? JSON.stringify(schema) : schema;
    
    // 1. Save Form
    const request = pool.request()
        .input("FormId", sql.Int, formId || null)
        .input("Title", sql.NVarChar(200), title)
        .input("SchemaJson", sql.NVarChar(sql.MAX), schemaStr)
        .input("IsActive", sql.Bit, isActive !== undefined ? isActive : 1);

    const result = await request.execute("sp_SaveForm");
    const savedId = result.recordset[0].FormId;

    // 2. Set Default if requested
    if (isDefault) {
        await pool.request()
            .input("FormId", sql.Int, savedId)
            .execute("sp_SetFormDefault");
    }

    res.json({ success: true, message: "Form saved", formId: savedId });

  } catch (err) {
    console.error("Save Error", err);
    res.status(500).json({ message: "Failed to save form" });
  }
};

// Delete Form
async function deleteForm(req, res) {
    const { id } = req.params;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("FormId", sql.Int, id)
            .execute("sp_DeleteForm");
            
        if(result.recordset[0].Success) {
            res.json({ success: true, message: "Form deleted successfully" });
        } else {
            res.status(404).json({ message: "Form not found" });
        }
    } catch (err) {
        console.error("Delete Form Error:", err);
        res.status(500).json({ message: "Failed to delete form" });
    }
}

module.exports = { createForm, getForms, getFormById, getDefaultForm, deleteForm };
