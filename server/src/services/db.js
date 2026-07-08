const mysql = require('mysql2/promise')
const config = require('../config')

let pool = null

function getPool() {
  if (!pool) {
    pool = mysql.createPool(config.db)
  }
  return pool
}

/**
 * 执行 SQL 查询
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数数组
 * @returns {Promise<Array>} 查询结果行数组
 */
async function query(sql, params = []) {
  const p = getPool()
  const [rows] = await p.query(sql, params)
  return rows
}

/**
 * 执行 INSERT 并返回插入ID
 */
async function insert(sql, params = []) {
  const p = getPool()
  const [result] = await p.execute(sql, params)
  return result.insertId
}

/**
 * 执行 UPDATE/DELETE 并返回影响行数
 */
async function execute(sql, params = []) {
  const p = getPool()
  const [result] = await p.execute(sql, params)
  return result.affectedRows
}

/**
 * 获取单行记录
 */
async function getOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows.length > 0 ? rows[0] : null
}

/**
 * 开启事务
 */
async function transaction(callback) {
  const p = getPool()
  const conn = await p.getConnection()
  try {
    await conn.beginTransaction()
    const result = await callback(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = { getPool, query, insert, execute, getOne, transaction }
