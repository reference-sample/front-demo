<template>
  <div class="login">
    <h4>Login</h4>
    <el-form
    ref="ruleFormRef"
    style="max-width: 600px"
    :model="ruleForm"
    status-icon
    :rules="rules"
    label-width="auto"
    class="demo-ruleForm"
  >
    <el-form-item label="UserName" prop="username">
      <el-input v-model="ruleForm.username" autocomplete="off" />
    </el-form-item>
    <el-form-item label="Password" prop="password">
      <el-input v-model="ruleForm.password" type="password" autocomplete="off" />
    </el-form-item>

    <el-form-item class="btns">
      <el-button type="primary" @click="submitForm(ruleFormRef)"> Login </el-button>
      <el-button @click="resetForm(ruleFormRef)">Reset</el-button>
    </el-form-item>
  </el-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import {login} from "@/api"
import router from '@/router'

const ruleFormRef = ref<FormInstance>()

const ruleForm = reactive({
  username: 'xiaoning',
  password: '123456',
})

const rules = reactive<FormRules<typeof ruleForm>>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
})

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate(async (valid) => {
    if (valid) {
      console.log('submit!')
      const data = new FormData()
      data.append("username", ruleForm.username)
      data.append("username", ruleForm.username)
      const res = await login(ruleForm)
      console.info(res);
      localStorage.setItem('userinfo', JSON.stringify(res))
      router.push('/')
    } else {
      console.log('error submit!')
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}
</script>
<style lang="scss" scoped>
.login {
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  h4 {
    font-size: 20px;
    color: #303030;
    margin-bottom: 60px;
  }
  .el-form {
    width: 400px;
  }
  .btns {
    margin-top: 40px;
    justify-content: center;
  }
  .btns :deep(.el-form-item__content) {
    flex: 0 0 auto;
    margin-left: 0 !important;
  }
}
</style>
