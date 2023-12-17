const User = require('../../models/user')
const jwt = require('jsonwebtoken')
const axios = require('axios')

const createUser = async (req, res) => {
  try {
    const user = new User(req.body)
    user.code = Date.now()
    await user.save()
    const token = await user.generateAuthToken()

    res.status(201).send({ user, token })
  } catch (e) {
    console.log("userController[14]", e);
    res.status(400).send(e)
  }

  // Sample input:
  /*
  {
    "name": "Sujeet1",
    "username": "sujeet1",
    "email": "sujeet1@gmail.com",
    "role": "instructor",
    "mobile": "9876543210",
    "password": "123456789",
    "passwordConfirm": "123456789",
    "agreement": true
  }

  */
}

const forgetPassword = async (req, res) => {
  const email = req.body.email
  const user = User.find({ email: email })
  try {
    if (!user) {
      throw new Error('Please Register First ')
    }
    res.status(200).send('Check your Email')
  } catch (e) {
    res.status(404).send('email not founded')
    console.log("userController[44]", e);
  }
}

const login = async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()
    res.send({ user, token })
  } catch (e) {
    res.status(400).send()
    console.log("userController[55]", e)
  }


  // Sample input:
  /*
  {
    "email": "sujeet1@gmail.com",
    "password": "123456789",
    "remember": true
  }
  */
}

const logout = async (req, res) => {
  try {
    let token
    const authorization = req.get('authorization')
    if (authorization && authorization.startsWith('Bearer')) {
      token = authorization.substring(7)
    }
    const decoded = jwt.decode(token)
    const user = await User.findOne({ _id: decoded._id })

    if (!user) res.status(400).send('token is corrupted')

    const alreadyInvalidated = await User.find({ invalidatedTokens: token })

    if (alreadyInvalidated.length === 0) user.invalidatedTokens.push(token)

    user.invalidatedTokens = user.invalidatedTokens.filter((token) => {
      const { exp } = jwt.decode(token)
      if (Date.now() >= exp * 1000) return false
      else return true
    })

    await user.save()

    res.send('You Logged out')
  } catch (e) {
    res.status(500).send({ error: e.message || e.toString() })
    console.log("userController[86]", e);
  }
}

const updateUser = async (req, res) => {
  try {
    const id = req.user._id
    const usr = req.body
    const userOld = await User.findById(id).exec()
    const user = await User.findByIdAndUpdate(id, usr, { new: true }).exec()
    const token = await user.generateAuthToken()

    if (user.email !== userOld.email || !(user.isEmailRegistered)) {
      axios.post(awsEmailResisterUrl, {
        InstructorEmail: user.email
      })
        .then(res => {
          console.log('email resistered: ' + res)
          User.findByIdAndUpdate(id, { isEmailRegistered: true }).exec()
        })
        .catch(err => {
          console.log("can't resister email: " + err)
          User.findByIdAndUpdate(id, { isEmailRegistered: false }).exec()
        })
    } else {
      console.log("email is not changed or already registered")
    }

    res.status(201).send({ user, token })
  } catch (e) {
    res.status(400).send(e)
    console.log("userController[117]", e);
  }
}

const deleteUser = async (req, res) => {
  try {
    await req.user.remove()
    res.status(200).send('Deleted thanks')
  } catch (e) {
    res.status(500).send('invalid Email')
    console.log("userController[127]", e);
  }
}

const me = async (req, res) => {
  res.send(req.user)
}

module.exports = {
  createUser,
  forgetPassword,
  login,
  updateUser,
  logout,
  deleteUser,
  me
}
