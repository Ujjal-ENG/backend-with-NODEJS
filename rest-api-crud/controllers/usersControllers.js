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