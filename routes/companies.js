/** Company Routes */

const express = require("express");
const slugify = require("slugify");
const ExpressError =require("../expressError")
const db = require("../db");
let router = new express.Router();

/** GET / List of Companies {companies: [{code, name}, ...]}*/
router.get("/", async function(req,res,next){
    try {
        const companyQuery = await db.query(
            `SELECT code, name 
            FROM companies 
            ORDERBY name`)
        return res.json({companies : companyQuery.rows});
        
    } catch(err){
        return next(err)
    }
});

/**GET /[code] = details on a company. 
 * Return obj of company: {company: {code, name, description}}
 * If the company given cannot be found, this should return a 404 status response
 */
router.get("/:code", async function(req, res, next){
    try{
        const companyQuery = await db.query(
            `SELECT code, name, description
            FROM companies
            WHERE code = $1`
            [req.params.code]
        );

        if (companyQuery.rows.length === 0){
            let notFoundError = new Error(`Company doesn't exist with id '${req.params.code}`);
            notFoundError.status =404;
            throw notFoundError;
        }
        return res.json({company: companyQuery.rows[0]  });
    }   catch (err){
        return next(err);
    }
});
			/** POST / => add new company
            *
            * {name, descrip}  =>  {company: {code, name, descrip}}
            *
            * */
             router.post("/", async function (req, res, next) {
                try {
                  let {name, description} = req.body;
                  let code = slugify(name, {lower: true});
                          const result = await db.query(
                        `INSERT INTO companies (code, name, description) 
                         VALUES ($1, $2, $3) 
                         RETURNING code, name, description`,
                      [code, name, description]);
                          return res.status(201).json({company: result.rows[0]}); // 201 CREATED
                }
                          catch (err) {
                  return next(err);
                }
              });
              
/**PUT /companies/[code]
 * Edit existing company.
 * Should return 404 if company cannot be found.
 * Returns obj of new company: {company: {code, name, description}}
 * Needs to be given JSON like: {name, description}
 * Returns update company object: {company: {code, name, description}}
 */

router.patch("/:code", async function(req, res, next){
    try{
        if("code" in req.body){
            throw newExpressError("Not Allowed", 400)
        }
    const result = await db.query(
        `UPDATE companies
        SET name=$1 , description=$2
        WHERE code =$3
        RETURNING code, name, description`
        [req.body.name, req.params.code, req.params.description]);
        
        if(result.rows.length === 0){
            throw newExpressError(`There is no such company with $[code]`, 404)
        }
        return res.json({ cat: result.rows[0]});
    }   catch (err){
        return next(err);
    }
});

/**DELETE /companies/[code]
 * Deletes company..
 * Should return 404 if company cannot be found.
 * Returns: {status: "deleted"}
 */
 router.delete("/:code", async function(req, res, next) {
    try {
      const result = await db.query(
        "DELETE FROM companies WHERE code = $1 RETURNING code", [req.params.code]);
  
      if (result.rows.length === 0) {
        throw new ExpressError(`There is no company with code of '${req.params.code}`, 404);
      }
      return res.json({"status":" deleted"});
    } catch (err) {
      return next(err);
    }
  });
  module.exports = router;

