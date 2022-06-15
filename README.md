# EasyBudget - Backend

The backend project of the [easybudget frontend](https://github.com/cristianrodri/easybudget-frontend)

You can visit the production website of the frontend project [here](https://easybudget.vercel.app)

## Setup

### Local files

You need to create a .env file in your root directory of the project and add the following

```
  HOST=0.0.0.0
  PORT=1337
  CLOUDINARY_NAME=***********
  CLOUDINARY_KEY=************
  CLOUDINARY_SECRET=*********
```

The files of the project is saved in cloudinary servers, so you need to add your own credentials from your cloudinary profile

### Install dependencies

```
  yarn install
```

### Run the server

```
  yarn run develop
```
