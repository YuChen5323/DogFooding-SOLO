import { ElMessage, ElMessageBox } from 'element-plus'
import type { MessageParams } from 'element-plus'

type ToastType = 'success' | 'warning' | 'error' | 'info'

export const useToast = (
  type: ToastType,
  message: string,
  options?: Partial<MessageParams>
) => {
  ElMessage({
    type,
    message,
    duration: 3000,
    showClose: true,
    ...options
  })
}

export const useConfirm = async (
  message: string,
  title: string = '确认'
): Promise<boolean> => {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    return true
  } catch {
    return false
  }
}
