import connection from "./db";

async function testDb(){
    try{
        const [rows] = await connection.execute("SELECT 1 + 1 AS solution");
        console.log("Test query successful. Solution: ", rows[0].solution);
    } catch(errror){
        console.log('problem', error);
    } finally{
        connection.end();
    }
}


testDb();