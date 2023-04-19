import { v4 as uuidv4 } from 'uuid'
const users = [
  {
    firstName: "Ujjal",
    lastName: "Roy",
    age: 23
  },
  {
    firstName: "Ador",
    lastName: "Roy",
    age: 22
  }
]

export const getAllUsers = (req, res) => {
  res.status(200).json({
    msg: "Data is Successfully get",
    results: users.length,
    data: users
  })
}
export const createUser = async (req, res) => {
  try {

    const data = await (req.body)
    const userId = uuidv4()
    res.status(201).json({
    msg: "Data is Successfully created",
    results: users.length,
    data: users.push({...data,id:userId})
  })
  } catch (error) {
    res.status(201).json({
      msg:error,
    })
  }
}
export const findUserById = async (req, res) => {
  try {

    const id = await (req.body.id)
console.log(id)
    res.status(201).json({
    msg: "Data is Successfully created",
    results: users.length,
    data: users.push(data)
  })
  } catch (error) {
    res.status(201).json({
      msg:error,
    })
  }
}